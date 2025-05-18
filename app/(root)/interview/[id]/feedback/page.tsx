import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";
import Image from "next/image";
import dayjs from "dayjs";
import { dummyInterviews } from "@/constants"; // Just import dummyInterviews

const Page = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  // Try to get the real interview
  let interview = await getInterviewById(id);
  let feedback = null;

  // If it's a real interview or dummy interview, get feedback from database
  if (interview || dummyInterviews.some((dummy) => dummy.id === id)) {
    // For dummy interviews, we'll find it first
    if (!interview) {
      interview = dummyInterviews.find((dummy) => dummy.id === id)!;
    }

    // Get feedback from database for both real and dummy interviews
    feedback = await getFeedbackByInterviewId({
      interviewId: id,
      userId: user?.id || "dummy-user",
    });
  } else {
    // Neither real nor dummy interview found
    redirect("/");
  }

  // If no feedback found, redirect to the interview page to take it first
  if (!feedback) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-20">
        <h2>No feedback found for this interview</h2>
        <p>You need to complete the interview first to get feedback.</p>
        <Button className="btn-primary">
          <Link href={`/interview/${id}`}>Take Interview</Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      <div className="flex flex-row justify-center ">
        <div className="flex flex-row gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore}
              </span>
              /100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      <p>{feedback?.finalAssessment}</p>

      {/* Interview Breakdown */}
      <div className="flex flex-col gap-4">
        <h2>Breakdown of the Interview:</h2>
        {feedback?.categoryScores?.map((category, index) => (
          <div key={index}>
            <p className="font-bold">
              {index + 1}. {category.name} ({category.score}/100)
            </p>
            <p>{category.comment}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h3>Strengths</h3>
        <ul>
          {feedback?.strengths?.map((strength, index) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3>Areas for Improvement</h3>
        <ul>
          {feedback?.areasForImprovement?.map((area, index) => (
            <li key={index}>{area}</li>
          ))}
        </ul>
      </div>

      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link
            href={`/interview/${id}`}
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-black text-center">
              Retake Interview
            </p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Page;
