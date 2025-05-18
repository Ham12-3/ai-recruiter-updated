"use server";

import { feedbackSchema } from "@/constants";
import { db } from "@/firebase/admin";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;
  const interviews = await db
    .collection("interviews")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  // Changed from Interview[] | null to Interview | null
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

export async function createFeedback({
  interviewId,
  userId,
  transcript,
  isDummy = false,
  preGeneratedFeedback = null,
}: CreateFeedbackParams) {
  try {
    // If we have pre-generated feedback (from Gemini for dummy interviews)
    if (preGeneratedFeedback) {
      // Store the pre-generated feedback directly
      const feedbackRef = await db.collection("feedback").add({
        interviewId,
        userId,
        transcript,
        isDummy, // Store this flag to identify dummy feedback
        ...preGeneratedFeedback, // Spread the pre-generated feedback
        createdAt: new Date(),
      });

      return { success: true, feedbackId: feedbackRef.id };
    }

    // If it's a real interview, continue with your existing logic
    // to generate feedback from transcript and save it

    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const {
      object: {
        totalScore,
        categoryScores,
        strengths,
        areasForImprovement,
        finalAssessment,
      },
    } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = await db.collection("feedback").add({
      interviewId,
      userId,
      totalScore,
      categoryScores,
      strengths,
      areasForImprovement,
      finalAssessment,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      feedbackId: feedback.id,
    };
  } catch (error) {
    console.error("Error creating feedback:", error);
    return { success: false, feedbackId: null };
  }
}

export async function getFeedbackByInterviewId({
  interviewId,
  userId,
}: GetFeedbackByInterviewIdParams): Promise<Feedback | null> {
  try {
    // Query will now work for both real and dummy feedback
    const feedbackSnapshot = await db
      .collection("feedback")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (feedbackSnapshot.empty) return null;

    const feedback = feedbackSnapshot.docs[0].data();
    return {
      id: feedbackSnapshot.docs[0].id,
      ...feedback,
    } as Feedback;
  } catch (error) {
    console.error("Error getting feedback:", error);
    return null;
  }
}

// Add this new function to get all feedback for a user
export async function getAllUserFeedback(userId: string): Promise<Feedback[]> {
  try {
    const feedbackSnapshot = await db
      .collection("feedback")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    if (feedbackSnapshot.empty) return [];

    return feedbackSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Feedback[];
  } catch (error) {
    console.error("Error getting user feedback:", error);
    return [];
  }
}
