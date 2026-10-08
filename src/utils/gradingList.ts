import type { Submission } from "../services/api";

export type GradeFilter = "all" | "ungraded" | "graded";
export type GradeOrder = "newest" | "oldest" | "name";

/** The submitting student; staff responses populate it, learner ones send a bare id. */
export const studentOf = (s: Submission) =>
  typeof s.student === "string" ? { _id: s.student, name: "Student", email: undefined } : s.student;

const time = (s: Submission) => new Date(s.submittedAt).getTime();

/** One assignment's submissions as the grading list shows them: filtered, searched, sorted. */
export function visibleSubmissions(
  submissions: Submission[],
  { filter, query, order }: { filter: GradeFilter; query: string; order: GradeOrder },
): Submission[] {
  const needle = query.trim().toLowerCase();
  return submissions
    .filter((s) => (filter === "all" ? true : filter === "graded" ? s.grade != null : s.grade == null))
    .filter((s) => {
      if (!needle) return true;
      const st = studentOf(s);
      return `${st.name} ${st.email ?? ""}`.toLowerCase().includes(needle);
    })
    .sort((a, b) => {
      if (order === "name") {
        // Same name: newest submission first
        return studentOf(a).name.localeCompare(studentOf(b).name, undefined, { sensitivity: "base" }) || time(b) - time(a);
      }
      return order === "oldest" ? time(a) - time(b) : time(b) - time(a);
    });
}
