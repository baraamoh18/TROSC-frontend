import { useState } from "react";
import toast from "react-hot-toast";
import * as api from "../../services/api";
import type { AuthUser } from "../../services/api";
import PendingApprovals from "../Instructor/PendingApprovals";
import { errorMessage } from "./studioUi";

interface StudioRequestsProps {
  trackId: string;
  pendingStudents: AuthUser[];
  pendingLeaves: AuthUser[];
  loading: boolean;
  /** Reload pending lists and the track (student count) after a decision. */
  onChanged: () => Promise<void> | void;
}

const StudioRequests = ({ trackId, pendingStudents, pendingLeaves, loading, onChanged }: StudioRequestsProps) => {
  const [busyId, setBusyId] = useState<string | null>(null);

  const act = async (studentId: string, call: () => Promise<unknown>, success: string, failure: string) => {
    setBusyId(studentId);
    try {
      await call();
      toast.success(success);
      await onChanged();
    } catch (err) {
      toast.error(errorMessage(err, failure));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PendingApprovals
        heading="Join requests"
        people={pendingStudents}
        loading={loading}
        busyId={busyId}
        emptyMessage="No students are waiting to join this track."
        onApprove={(id) =>
          act(id, () => api.approveEnrollment(trackId, id), "Student approved and added to the track.", "Approval failed.")
        }
        onReject={(id) => act(id, () => api.rejectEnrollment(trackId, id), "Join request rejected.", "Rejection failed.")}
      />
      <PendingApprovals
        heading="Leave requests"
        people={pendingLeaves}
        loading={loading}
        busyId={busyId}
        approveLabel="Approve leave"
        rejectLabel="Reject leave"
        emptyMessage="No students have asked to leave this track."
        onApprove={(id) =>
          act(id, () => api.approveLeave(trackId, id), "Leave approved. The student was removed from the track.", "Approval failed.")
        }
        onReject={(id) =>
          act(id, () => api.rejectLeave(trackId, id), "Leave rejected. The student stays in the track.", "Rejection failed.")
        }
      />
    </div>
  );
};

export default StudioRequests;
