import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userid } = await request.json();

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

    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
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
        Return the questions formatted strictly as a JSON array of strings, like this:
        ["Question 1", "Question 2", "Question 3"]
    `,
    });

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techstack.split(","),
      questions: JSON.parse(questions),
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
