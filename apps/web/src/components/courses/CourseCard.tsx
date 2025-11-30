"use client";

import { Course } from "@/types/course";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const router = useRouter();
  const { isConnected } = useAccount();

  const handleClick = () => {
    if (course.isComingSoon) {
      return; // Don't navigate if coming soon
    }
    router.push(`/courses/${course.id}`);
  };

  // Format: "50 Q • 90 MIN" (inspired by realmind: "3 Q • 1-2 MIN")
  const formatInfo = () => {
    const questions = `${course.questionCount} Q`;
    const time = course.estimatedTime.toUpperCase().replace("MINUTES", "MIN").replace("MINUTE", "MIN");
    return `${questions} • ${time}`;
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative bg-white dark:bg-[var(--celo-purple)] 
        border-[2px] border-black dark:border-white 
        p-5 cursor-pointer transition-all duration-200
        shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#FFFFFF]
        hover:shadow-[5px_5px_0px_#000000] dark:hover:shadow-[5px_5px_0px_#FFFFFF]
        hover:-translate-y-1 hover:-translate-x-1
        ${course.isComingSoon ? "opacity-60 cursor-not-allowed" : ""}
      `}
      style={{
        borderColor: course.isComingSoon ? "#999" : undefined,
      }}
    >
      {/* Top Right Indicator (realmind style) */}
      <div className="absolute top-3 right-3 w-8 h-0.5 bg-black dark:bg-white"></div>

      {/* Coming Soon Badge */}
      {course.isComingSoon && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-yellow-400 text-black font-bold border border-black text-xs px-2 py-0.5">
            COMING SOON
          </Badge>
        </div>
      )}

      {/* Icon (top left, smaller) */}
      <div className="mb-3">
        <div
          className="text-3xl"
          style={{ color: course.color }}
        >
          {course.icon}
        </div>
      </div>

      {/* Title (bold, prominent) */}
      <h3 className="font-headline text-xl font-bold text-black dark:text-white mb-2 uppercase leading-tight">
        {course.name}
      </h3>

      {/* Description (compact, 2-3 lines) */}
      <p className="font-body text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed line-clamp-3">
        {course.description}
      </p>

      {/* Info Line (realmind style: "3 Q • 1-2 MIN") */}
      <p className="font-body text-xs text-gray-500 dark:text-gray-400 mb-3">
        {formatInfo()}
      </p>

      {/* Tag at bottom right (realmind style) */}
      <div className="flex justify-end mt-4">
        {course.certificationCode ? (
          <Badge className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-3 py-1 border border-black dark:border-white">
            {course.certificationCode}
          </Badge>
        ) : (
          <Badge className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-3 py-1 border border-black dark:border-white">
            AWS
          </Badge>
        )}
      </div>
    </div>
  );
}

