"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer, generatorAssistant } from "@/constants";
import { createFeedback, getInterviewsByUserId } from "@/lib/actions/general.action";

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
  interviewId,
  feedbackId,
  type,
  questions,
  role,
  interviewType,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingFeedback = React.useRef(false);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.log("Error:", error);
    };

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

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      if (isGeneratingFeedback.current) return;
      isGeneratingFeedback.current = true;
      setIsGenerating(true);
      
      console.log("handleGenerateFeedback");

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
        feedbackId,
      });

      if (success && id) {
        const isTechnicalOrDev = 
          role?.toLowerCase().includes("developer") || 
          role?.toLowerCase().includes("engineer") || 
          role?.toLowerCase().includes("software") ||
          interviewType?.toLowerCase().includes("technical") || 
          interviewType?.toLowerCase().includes("mixed");

        if (isTechnicalOrDev) {
          router.push(`/interview/${interviewId}/coding`);
        } else {
          router.push(`/interview/${interviewId}/feedback`);
        }
      } else {
        console.log("Error saving feedback");
        setIsGenerating(false);
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        // Find the latest interview created for this user and redirect to it
        const findAndRedirect = async () => {
          if (isGeneratingFeedback.current) return;
          isGeneratingFeedback.current = true;
          setIsGenerating(true);
          try {
            // Small delay to ensure Firebase has saved the interview
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const interviews = await getInterviewsByUserId(userId!);
            if (interviews && interviews.length > 0) {
              const latestInterview = interviews[0];
              router.push(`/interview/${latestInterview.id}`);
            } else {
              router.push("/");
            }
          } catch (error) {
            console.error("Error finding interview:", error);
            router.push("/");
          }
        };
        findAndRedirect();
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId, role, interviewType]);

  const handleCall = async () => {
    try {
      setCallStatus(CallStatus.CONNECTING);

      if (type === "generate") {
        const customGenerator = JSON.parse(JSON.stringify(generatorAssistant));
        if (customGenerator.model?.messages?.length > 0) {
          customGenerator.model.messages[0].content = customGenerator.model.messages[0].content.replace(
            "{{username}}",
            userName
          );
        }
        
        // Replace userid in the tool parameter description so the AI passes it
        if (customGenerator.model?.tools?.length > 0) {
          const useridProp = customGenerator.model.tools[0].function.parameters.properties.userid;
          if (useridProp) {
            useridProp.description = useridProp.description.replace("{{userid}}", userId || "");
          }
        }

        await vapi.start(customGenerator);
      } else {
        let formattedQuestions = "";
        if (questions) {
          formattedQuestions = questions
            .map((question) => `- ${question}`)
            .join("\n");
        }

        const customInterviewer = JSON.parse(JSON.stringify(interviewer));
        if (customInterviewer.model?.messages?.length > 0) {
          customInterviewer.model.messages[0].content = customInterviewer.model.messages[0].content.replace(
            "{{questions}}",
            formattedQuestions
          );
        }

        await vapi.start(customInterviewer);
      }
    } catch (error: unknown) {
      console.error("VAPI call failed:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="profile-image"
              width={539}
              height={539}
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
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {isGenerating ? (
          <button className="btn-call opacity-50 cursor-not-allowed">
            {type === "generate" ? "Setting up your interview..." : "Analyzing your performance..."}
          </button>
        ) : callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()}>
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Start Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End Interview
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
