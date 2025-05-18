import InterviewCard from "@/components/InterviewCard";
import FeedbackCard from "@/components/FeedbackCard";
import { Button } from "@/components/ui/button";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
  getAllUserFeedback,
} from "@/lib/actions/general.action";
import Image from "next/image";
import Link from "next/link";
import React from "react";

// In page.tsx, temporarily use dummy data
import { dummyInterviews } from "@/constants";

const Page = async () => {
  const user = await getCurrentUser();

  // Get interviews and feedback with proper null handling
  const [fetchedUserInterviews, fetchedLatestInterviews, userFeedback] =
    await Promise.all([
      getInterviewsByUserId(user?.id || ""),
      getLatestInterviews({ userId: user?.id || "" }),
      getAllUserFeedback(user?.id || ""),
    ]);

  // Create safe arrays that can't be null by using null coalescing operator
  const userInterviews =
    fetchedUserInterviews && fetchedUserInterviews.length > 0
      ? fetchedUserInterviews
      : dummyInterviews;

  const latestInterviews =
    fetchedLatestInterviews && fetchedLatestInterviews.length > 0
      ? fetchedLatestInterviews
      : dummyInterviews;

  // Now TypeScript knows these are always arrays
  const hasPastInterviews = userInterviews.length > 0;
  const hasUpcomingInterviews = latestInterviews.length > 0;
  const hasFeedback = userFeedback.length > 0;

  return (
    <>
      {/* Debug Display - Remove this after debugging */}
      <div
        style={{
          margin: "20px",
          padding: "15px",
          background: "#333",
          border: "1px solid #666",
          borderRadius: "5px",
        }}
      >
        <h4>Debug Info (remove in production)</h4>
        <p>User ID: {user?.id || "Not found"}</p>
        <p>User Interviews count: {userInterviews.length}</p>
        <p>Latest Interviews count: {latestInterviews.length}</p>
        <p>
          Using Dummy Data:{" "}
          {fetchedUserInterviews === null || fetchedUserInterviews.length === 0
            ? "Yes"
            : "No"}
        </p>
      </div>

      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview Ready with AI-Powered Practice & Feedback</h2>

          <p className="text-lg">
            Practice on real interview questions & get instant feedback
          </p>
          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>
        <Image
          src="/robot.png"
          alt="robo dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>
      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>
        <div className="interviews-section">
          {hasPastInterviews ? (
            userInterviews.map((interview) => (
              <InterviewCard {...interview} key={interview.id} />
            ))
          ) : (
            <p>You haven't taken any interviews yet</p>
          )}
        </div>
      </section>
      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interview Feedback</h2>
        <div className="feedback-section">
          {hasFeedback ? (
            userFeedback.map((feedback) => {
              // Find matching interview to get role information
              const relatedInterview = userInterviews.find(
                (interview) => interview.id === feedback.interviewId
              );

              return (
                <FeedbackCard
                  key={feedback.id}
                  id={feedback.id}
                  interviewId={feedback.interviewId}
                  totalScore={feedback.totalScore}
                  finalAssessment={feedback.finalAssessment}
                  createdAt={feedback.createdAt}
                  role={relatedInterview?.role || "Interview"}
                />
              );
            })
          ) : (
            <p>No feedback available yet</p>
          )}
        </div>
      </section>
      <section className="flex flex-col gap-6 mt-8">
        <h2>Take an Interview</h2>

        <div className="interviews-section">
          {hasUpcomingInterviews ? (
            latestInterviews.map((interview) => (
              <InterviewCard {...interview} key={interview.id} />
            ))
          ) : (
            <p>There are no new interviews available</p>
          )}
        </div>
      </section>
    </>
  );
};

export default Page;
