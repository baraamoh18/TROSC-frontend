# RBAC and private Google Drive submissions

This is the backend contract expected by the frontend. The browser never receives
a Drive folder URL, Drive file ID, service-account credential, or a Drive access
token. A learner-facing submission response contains metadata only.

## 1. Model the access level as a capability, not a user role

Keep staff permissions (`student`, `instructor`, `admin`) separate from a learner's
relationship to a track. The following table is calculated on every request:

| Request principal | Sessions | Progress | Tasks and uploads |
| --- | --- | --- | --- |
| Guest | `title`, `description`, schedule only | none | none |
| Authenticated, not enrolled | video/media allowed | none | none |
| Authenticated, active enrollment | video/media allowed | read/write | read/upload |

Use separate collections rather than synchronising many user arrays. They make the
authorization query explicit and enforceable with unique indexes.

```js
// enrollment.model.js
const EnrollmentSchema = new Schema({
  user:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  track: { type: Schema.Types.ObjectId, ref: 'Track', required: true, index: true },
  status: { type: String, enum: ['active', 'left'], default: 'active' },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });
EnrollmentSchema.index({ user: 1, track: 1 }, { unique: true });

// sessionProgress.model.js
const SessionProgressSchema = new Schema({
  user:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  status:  { type: String, enum: ['not_started', 'watched'], default: 'not_started' },
  watchedAt: Date,
}, { timestamps: true });
SessionProgressSchema.index({ user: 1, session: 1 }, { unique: true });

// taskSubmission.model.js -- driveFileId must never be serialized to learners
const TaskSubmissionSchema = new Schema({
  assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  driveFileId: { type: String, required: true, select: false },
  fileName: { type: String, required: true },
  fileSize: Number,
  mimeType: String,
  submittedAt: { type: Date, default: Date.now },
  grade: Number,
}, { timestamps: true });
TaskSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
```

The `Join Track` action must create or reactivate an **active** `Enrollment` in a
transaction. Do not treat a client-side `enrolled` flag as authorization. If the
product needs approval, use `pending` as a distinct status and unlock nothing until
it becomes `active`.

## 2. Enforce capabilities in the API

The UI is only a friendly representation of these rules. Each protected route must
check the authenticated user and active enrollment again on the server.

```js
// requireEnrollment.js
export const requireActiveEnrollment = (getTrackId) => async (req, res, next) => {
  const trackId = await getTrackId(req); // derive from the target resource, never req.body
  const allowedStaff = ['instructor', 'admin'].includes(req.user.role);
  const enrolled = await Enrollment.exists({
    user: req.user._id, track: trackId, status: 'active',
  });

  if (!allowedStaff && !enrolled) return next(new AppError('Join this track first.', 403));
  next();
};
```

Recommended endpoints:

```text
GET  /v1/tracks/:trackId/session-catalog       public; title/description/date/duration only
GET  /v1/sessions/track/:trackId               authenticated; media URLs permitted
PUT  /v1/sessions/:sessionId/progress          active enrollment required
GET  /v1/tracks/:trackId/weekly-tasks          active enrollment required
GET  /v1/tracks/:trackId/assignments           active enrollment required
POST /v1/assignments/:assignmentId/submissions active enrollment required; multipart field "file"
```

For the catalog route use an explicit projection, not a full `Session` document:

```js
router.get('/tracks/:trackId/session-catalog', async (req, res) => {
  const sessions = await Session.find({ tracks: req.params.trackId, published: true })
    .select('_id title description startDate duration')
    .lean();
  res.json({ status: 'success', data: { sessions } });
});
```

Progress must be an upsert after the enrollment check. Do not accept `userId` from
the client.

```js
router.put('/sessions/:sessionId/progress', protect, requireEnrollmentForSession,
  async (req, res) => {
    if (req.body.status !== 'watched') throw new AppError('Unsupported progress state.', 400);
    const progress = await SessionProgress.findOneAndUpdate(
      { user: req.user._id, session: req.params.sessionId },
      { $set: { status: 'watched', watchedAt: new Date() } },
      { upsert: true, new: true, runValidators: true },
    );
    res.json({ status: 'success', data: { progress } });
  },
);
```

## 3. Configure Google Drive once, on the server

1. Create a dedicated Google Cloud service account and enable the Google Drive API.
2. Create one submission folder owned by the organisation. Share **that folder only**
   with the service-account email as Editor. Do not make it public or link-accessible.
3. Store `GOOGLE_SERVICE_ACCOUNT_JSON` (the service-account JSON, preferably from
   your secret manager) and `GOOGLE_DRIVE_SUBMISSIONS_FOLDER_ID` in the API's secret
   store. Never prefix either with `VITE_`, commit it, or send it to a browser.
4. Install `googleapis`, `multer`, and preferably `file-type` in the backend. Limit
   and validate files server-side; the browser's `accept` attribute is only a hint.

```js
// drive.service.js
import { google } from 'googleapis';
import { Readable } from 'node:stream';

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});
const drive = google.drive({ version: 'v3', auth });

export async function saveSubmissionToDrive({ buffer, mimeType, fileName, assignmentId, userId }) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 120);
  const result = await drive.files.create({
    requestBody: {
      // Generated names avoid collisions and are useful for staff audit trails.
      name: `${assignmentId}_${userId}_${Date.now()}_${safeName}`,
      parents: [process.env.GOOGLE_DRIVE_SUBMISSIONS_FOLDER_ID],
      appProperties: { assignmentId: String(assignmentId), userId: String(userId) },
    },
    media: { mimeType, body: Readable.from(buffer) },
    // Never ask Drive to make the file public and never return webViewLink.
    fields: 'id,name,mimeType,size',
    supportsAllDrives: true,
  });
  return result.data;
}
```

The server receives the browser upload and writes it to Drive. This is the simplest
private design. For very large files, issue a short-lived, scoped upload session from
your backend and keep the same authorization check; do not give the browser a Drive
OAuth token or a folder permission.

## 4. Upload route and response shape

Authorize before `multer` reads file bytes. Validate the maximum size, detected MIME
type, extension, and optionally scan with your malware provider before calling Drive.
`memoryStorage` is appropriate only while the configured maximum file size fits the
API's memory budget; use a private temporary disk/stream pipeline for larger limits.

```js
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { saveSubmissionToDrive } from '../services/drive.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});
const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword', 'application/zip', 'image/png', 'image/jpeg',
]);

router.post('/assignments/:assignmentId/submissions',
  protect,
  requireEnrollmentForAssignment, // loads assignment and verifies active enrollment
  upload.single('file'),
  async (req, res) => {
    if (!req.file) throw new AppError('Attach one file.', 400);
    const detected = await fileTypeFromBuffer(req.file.buffer);
    const mimeType = detected?.mime ?? req.file.mimetype;
    if (!ALLOWED_MIMES.has(mimeType)) throw new AppError('This file type is not allowed.', 415);

    const driveFile = await saveSubmissionToDrive({
      buffer: req.file.buffer, mimeType, fileName: req.file.originalname,
      assignmentId: req.params.assignmentId, userId: req.user._id,
    });
    const submission = await TaskSubmission.findOneAndUpdate(
      { assignment: req.params.assignmentId, student: req.user._id },
      { driveFileId: driveFile.id, fileName: req.file.originalname,
        fileSize: Number(driveFile.size), mimeType, submittedAt: new Date() },
      { new: true, upsert: true, runValidators: true },
    ).select('student fileName fileSize mimeType submittedAt grade');

    res.status(201).json({ status: 'success', message: 'Assignment submitted.', data: {
      submission,
    }});
  },
);
```

Add error handling for Multer's `LIMIT_FILE_SIZE`, rate-limit this route per account,
and record an audit event without logging file contents. If the database write fails
after Drive succeeds, delete the newly-created Drive file in a compensating action or
queue it for cleanup. Staff who need to download a submission should use a separate
server-authorized download endpoint; it may proxy the bytes or generate a short-lived
file download, but must never be available to a learner who does not own that record.

## 5. Frontend behavior implemented here

The assignment modal uses a native file picker and drag-and-drop zone. It has clear
selected, uploading, success, and error states. It sends only `FormData` to
`POST /v1/assignments/:id/submissions`; no Drive address is collected, persisted, or
rendered. The UI limits uploads to 20 MB and allowed extensions for convenience, but
the server validation above is the security boundary.

The client also calls the media-free catalog for guests, hides task endpoints until an
active enrollment appears in `/users/me`, and sends `PUT /sessions/:id/progress` only
for enrolled learners. These conditions improve UX; they never replace the backend
checks above.
