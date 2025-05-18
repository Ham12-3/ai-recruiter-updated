"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import TimeAgo from "react-timeago"; // Import TimeAgo

interface FeedbackCardProps {
  id: string;
  interviewId: string;
  totalScore: number;
  finalAssessment: string;
  createdAt: string;
  role?: string;
}

const FeedbackCard = ({
  id,
  interviewId,
  totalScore,
  finalAssessment,
  createdAt,
  role = "Interview",
}: FeedbackCardProps) => {
  return (
    <Card className="feedback-card">
      <div className="flex flex-row justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={18} height={18} alt="score" />
            <h3 className="capitalize">{role} Feedback</h3>
          </div>
          <p className="text-sm text-gray-400">
            <TimeAgo date={createdAt} />{" "}
            {/* Replace calculateTimeAgo with TimeAgo */}
          </p>
        </div>
        <div className="flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-500">
          <span className="font-bold">{totalScore}/100</span>
        </div>
      </div>

      <p className="line-clamp-2 text-sm mt-2">{finalAssessment}</p>

      <div className="card-actions mt-4">
        <Link
          href={`/interview/${interviewId}/feedback`}
          className="text-primary-300 text-sm hover:text-primary-200 transition flex items-center gap-1"
        >
          View Full Feedback
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </Card>
  );
};

export default FeedbackCard;
