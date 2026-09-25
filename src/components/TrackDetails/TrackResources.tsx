import React from "react";
import { Link } from "react-router-dom";

export interface TrackResourceFile {
  title: string;
  url: string;
}

export interface TrackRecording {
  sessionId: string;
  title: string;
}

interface TrackResourcesData {
  pdfs: TrackResourceFile[];
  recordings: TrackRecording[];
}

interface TrackResourcesProps {
  resources: TrackResourcesData;
  trackTitle: string;
}

const linkCls =
  "text-primary font-bold text-sm underline decoration-2 underline-offset-4 hover:text-primary-hover transition-colors";

const TrackResources: React.FC<TrackResourcesProps> = ({ resources, trackTitle }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{trackTitle} Resources</h2>
      <p className="text-gray-700 mb-8">All the materials you need — in one place</p>

      <div className="space-y-8">
        {resources.pdfs.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-gray-900 rounded-full"></span>
              PDF Guides
            </h3>
            <ul className="space-y-4 pl-6">
              {resources.pdfs.map((pdf, index) => (
                <li key={`${pdf.url}-${index}`} className="flex items-center justify-between gap-4">
                  <span className="text-gray-800 text-sm">{pdf.title}</span>
                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkCls}
                  >
                    open
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {resources.recordings.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-gray-900 rounded-full"></span>
              Sessions recordings
            </h3>
            <ul className="space-y-4 pl-6">
              {resources.recordings.map((rec) => (
                <li key={rec.sessionId} className="flex items-center justify-between gap-4">
                  <span className="text-gray-800 text-sm">{rec.title}</span>
                  {/* Link to the session viewer rather than the raw media URL so
                      the viewer's access checks and progress tracking apply. */}
                  <Link to={`/sessions/${rec.sessionId}`} className={linkCls}>
                    Click here to watch
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-b border-red-200 mt-12 mb-12 max-w-3xl"></div>
    </div>
  );
};

export default TrackResources;
