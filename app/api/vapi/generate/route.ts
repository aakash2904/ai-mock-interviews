import { generateObject } from "ai";
import { z } from "zod";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const body = await request.json();
  
  // VAPI wraps tool inputs inside the message object
  let toolArgs = body;
  let toolCallId = "mock-id";
  if (body?.message?.type === "tool-calls" && body?.message?.toolWithToolCallList?.length > 0) {
    const list = body.message.toolWithToolCallList;
    const callData = list.find((t: any) => t.toolCall.function.name === "generate_interview");
    if (callData) {
      toolArgs = typeof callData.toolCall.function.arguments === "string" 
        ? JSON.parse(callData.toolCall.function.arguments) 
        : callData.toolCall.function.arguments;
      toolCallId = callData.toolCall.id;
    }
  }

  const { type, role, level, techstack, amount, userid } = toolArgs;

  try {
    let resumeText = "";
    if (userid) {
      const userRecord = await db.collection("users").doc(userid).get();
      if (userRecord.exists) {
        resumeText = userRecord.data()?.resumeText || "";
      }
    }

    const promptContext = resumeText 
      ? `The candidate's resume/CV text is below to help you tailor the questions to their actual experience, projects, and skills. Do NOT mention that you are reading their resume, just ask questions naturally based on it.\n\nResume content:\n###\n${resumeText}\n###\n`
      : "";

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: z.object({
        questions: z.array(z.string()).describe("A list of domain-specific interview questions"),
      }),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        
        ${promptContext}
        
        Please return only the questions, without any additional text.
        Make the questions domain-specific. For example, if they are a Software Developer, ask them to explain specific concepts like variables, closure, React hooks, or system design based on their level. Dig into their specific projects if resume context is provided.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
    `,
    });

    const safeTechStack = Array.isArray(techstack) ? techstack : (techstack ? String(techstack).split(",") : []);

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: safeTechStack,
      questions: object.questions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    // VAPI requires a 'results' array mapped to the tool call ids
    return Response.json({ 
      results: [
        {
          toolCallId: toolCallId,
          result: "Interview successfully generated and saved."
        }
      ]
    }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
