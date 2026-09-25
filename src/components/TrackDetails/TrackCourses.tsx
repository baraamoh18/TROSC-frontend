import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  BarChart3,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Lock,
  Globe,
  Layers,
} from "lucide-react";
import type { BackendCourse } from "../../services/api";

// ── Access badge ──────────────────────────────────────────────

const AccessBadge = ({ access }: { access: BackendCourse["access"] }) => {
  if (access === "public")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        <Globe className="w-3 h-3" />
        Public
      </span>
    );
  if (access === "private")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
        <Lock className="w-3 h-3" />
        Private
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
      <Layers className="w-3 h-3" />
      Track only
    </span>
  );
};

// ── Level badge ───────────────────────────────────────────────

const LevelBadge = ({ level }: { level: BackendCourse["level"] }) => {
  const colors: Record<string, string> = {
    beginner: "bg-emerald-100 text-emerald-700",
    intermediate: "bg-amber-100 text-amber-700",
    advanced: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
        colors[level] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {level}
    </span>
  );
};

// ── Course card ───────────────────────────────────────────────

const CourseCard = ({ course }: { course: BackendCourse }) => {
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const hasSyllabus = course.syllabus && course.syllabus.length > 0;

  return (
    // The title link stretches over the whole card (after:inset-0), so the
    // card is clickable without nesting the syllabus button inside a link.
    <div className="group relative rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:ring-1 hover:ring-primary/40">
      {/* Cover image or gradient fallback */}
      {course.coverImage &&
      course.coverImage !== "https://placehold.co/800x400?text=Trosc+Course" ? (
        <img
          src={course.coverImage}
          alt=""
          className="w-full h-32 object-cover"
        />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-primary/80 to-primary-dark flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-white/70" />
        </div>
      )}

      <div className="p-4">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <LevelBadge level={course.level} />
          <AccessBadge access={course.access} />
        </div>

        <h3 className="font-bold text-gray-900 mb-1 leading-snug group-hover:text-primary transition-colors">
          <Link
            to={`/courses/${course._id}`}
            className="after:absolute after:inset-0 after:content-[''] focus:outline-none focus-visible:underline"
          >
            {course.title}
          </Link>
        </h3>

        {course.description && (
          <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
            {course.description}
          </p>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
          {course.sessionCount !== undefined && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {course.sessionCount} session{course.sessionCount !== 1 ? "s" : ""}
            </span>
          )}
          {course.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {course.duration}h
            </span>
          )}
          {course.studentCount !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {course.studentCount} enrolled
            </span>
          )}
          {course.instructor?.name && (
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              {course.instructor.name}
            </span>
          )}
        </div>

        {/* Syllabus accordion */}
        {hasSyllabus && (
          <div className="relative z-10">
            <button
              type="button"
              aria-expanded={syllabusOpen}
              onClick={() => setSyllabusOpen((o) => !o)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              {syllabusOpen ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Hide syllabus
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  View syllabus ({course.syllabus?.length ?? 0} topics)
                </>
              )}
            </button>

            {syllabusOpen && (
              <ol className="mt-2 space-y-1 list-decimal list-inside">
                {(course.syllabus ?? []).map((item, idx) => (
                  <li key={idx} className="text-xs text-gray-700 leading-snug">
                    <span className="font-medium">{item.title}</span>
                    {item.description && (
                      <span className="text-gray-500 ml-1">
                        — {item.description}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────

interface TrackCoursesProps {
  courses: BackendCourse[];
}

const TrackCourses: React.FC<TrackCoursesProps> = ({ courses }) => {
  if (courses.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Courses</h2>
        <p className="text-gray-500 text-sm">
          No courses have been added to this track yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Courses
        <span className="ml-2 text-base font-normal text-gray-400">
          ({courses.length})
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {courses.map((course) => (
          <CourseCard key={course._id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default TrackCourses;
