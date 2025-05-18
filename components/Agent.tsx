"use client";
import { cn } from "@/lib/utils";
import { createInterviewAssistant, vapi } from "@/lib/vapi.sdk";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
// Import the interviewer configuration from constants
import { dummyInterviews, interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  type,
  interviewId,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);

  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);

    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);
    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };

        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onError = (error: Error) => console.error("Error", error);

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  const handleGenerateFeedback = async (messages: SavedMessage[]) => {
    console.log("generate feedback here");

    // For dummy interviews, generate feedback with Gemini
    if (
      interviewId &&
      dummyInterviews.some((interview) => interview.id === interviewId)
    ) {
      try {
        console.log(
          "Calling /api/generate-feedback with transcript:",
          messages.length,
          "messages"
        );

        // Call your API endpoint that uses Gemini
        const response = await fetch("/api/generate-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: messages }),
        });

        if (!response.ok) {
          console.error(
            "Error response from generate-feedback:",
            response.status,
            response.statusText
          );
          const errorText = await response.text();
          console.error("Error details:", errorText);
          throw new Error(`Failed to generate feedback: ${response.status}`);
        }

        // Get the feedback data
        const feedbackData = await response.json();
        console.log("Received feedback data:", feedbackData);

        // Save to database
        // Rest of your code...
      } catch (error) {
        console.error("Error in API call:", error);
      }
    }

    // For real interviews (existing code)
    const { success, feedbackId: id } = await createFeedback({
      interviewId: interviewId!,
      userId: userId!,
      transcript: messages,
      isDummy: false,
    });

    // Rest of your existing code...
  };

  useEffect(() => {
    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, type, userId]);

  const handleCall = async () => {
    try {
      setCallStatus(CallStatus.CONNECTING);

      // Check if userId is defined before proceeding
      if (!userId) {
        console.error("User ID is required to start the interview");
        setCallStatus(CallStatus.INACTIVE);
        return;
      }

      // Base interview data for both types
      const baseInterviewData = {
        userName,
        userId,
        role: "Full Stack Developer",
        level: "Mid-level",
        techstack: ["React", "TypeScript", "Node.js"],
      };

      if (type === "generate") {
        // For generate type, use default questions
        await createInterviewAssistant({
          ...baseInterviewData,
          questions: [
            "Tell me about your experience with web development.",
            "How do you approach learning new technologies?",
            "Can you describe a challenging project you've worked on recently?",
            "What are your strengths as a developer?",
            "Do you have any questions about the position?",
          ],
        });
      } else {
        // For interview type, use the provided questions and merge with interviewer config
        if (!questions || questions.length === 0) {
          console.error("No questions provided for the interview");
          setCallStatus(CallStatus.INACTIVE);
          return;
        }

        // Create a deep copy of the interviewer config to avoid modifying the original
        const interviewerConfig = JSON.parse(JSON.stringify(interviewer));

        // Update the system message with the actual questions
        if (
          interviewerConfig.model.messages &&
          interviewerConfig.model.messages.length > 0
        ) {
          const systemPrompt = interviewerConfig.model.messages[0].content;
          const formattedQuestions = questions.join("\n- ");

          // Replace the {{questions}} placeholder with the actual questions
          interviewerConfig.model.messages[0].content = systemPrompt.replace(
            "{{questions}}",
            `- ${formattedQuestions}`
          );
        }

        // Update the first message to include the candidate's name
        interviewerConfig.firstMessage = `Hello ${userName}! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience as a ${baseInterviewData.role}.`;

        // Use the configured interviewer with user data
        await createInterviewAssistant({
          ...baseInterviewData,
          questions,
        });
      }
    } catch (error) {
      console.error("Error starting interview:", error);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = async () => {
    try {
      setCallStatus(CallStatus.FINISHED);
      await vapi.stop();
    } catch (error) {
      console.error("Error stopping interview:", error);
    }
  };

  const latestMessage = messages[messages.length - 1]?.content || "";

  const isCallInactiveOrFinished =
    callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="vapi"
              width={65}
              height={54}
              className="object-cover"
            />

            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="user avatar"
              width={540}
              height={540}
              className="rounded-full object-cover size-[120px]"
            />

            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={latestMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {latestMessage}
            </p>
          </div>
        </div>
      )}
      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={handleCall}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />
            <span>{isCallInactiveOrFinished ? "Call" : ". . ."}</span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
