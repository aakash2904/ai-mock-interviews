import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import { db } from "@/firebase/admin";

export async function POST(request: Request) {
  const { action, interviewId, userId, code } = await request.json();

  try {
    const interviewDoc = await db.collection("interviews").doc(interviewId).get();
    if (!interviewDoc.exists) {
      return Response.json({ success: false, error: "Interview not found" }, { status: 404 });
    }

    const interview = interviewDoc.data();

    // Action: Generate Question
    if (action === "generate_question") {
      const { text: question } = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt: `Generate exactly ONE coding challenge for a job interview.
          Role: ${interview?.role}
          Experience Level: ${interview?.level}
          Tech Stack: ${interview?.techstack?.join(", ")}
          
          The question should be solvable within 10-15 minutes in a browser editor.
          Provide ONLY the problem description, requirements, and example input/output. Use clean Markdown formatting.
        `,
      });

      return Response.json({ success: true, question }, { status: 200 });
    }

    // Action: Evaluate Code
    if (action === "evaluate_code") {
      const { object: evaluation } = await generateObject({
        model: google("gemini-2.0-flash-001", {
            structuredOutputs: false,
        }),
        schema: z.object({
          score: z.number().describe("Score from 0 to 100 on code quality and correctness"),
          feedback: z.string().describe("Detailed feedback on what was good and what could be improved"),
          strengths: z.array(z.string()).describe("List of strengths demonstrated in the code"),
          weaknesses: z.array(z.string()).describe("List of weaknesses or bugs in the code"),
        }),
        prompt: `Evaluate the following code submitted by a candidate during a coding interview.
          Role: ${interview?.role}
          Experience Level: ${interview?.level}
          
          Candidate's Code Submission:
          \`\`\`
          ${code}
          \`\`\`
          
          Provide a score, detailed feedback, strengths, and areas for improvement. Be critical and professional.
        `,
      });

      // Fetch the existing feedback document to append this
      const feedbackQuery = await db.collection("feedback")
        .where("interviewId", "==", interviewId)
        .where("userId", "==", userId)
        .limit(1)
        .get();

      if (!feedbackQuery.empty) {
        const feedbackDoc = feedbackQuery.docs[0];
        const existingFeedback = feedbackDoc.data();
        
        let existingStrengths = existingFeedback.strengths || [];
        let existingAreas = existingFeedback.areasForImprovement || [];
        
        // Push coding feedback into the mix
        existingStrengths = [...existingStrengths, ...evaluation.strengths.map((s: string) => `[Coding]: ${s}`)];
        existingAreas = [...existingAreas, ...evaluation.weaknesses.map((w: string) => `[Coding]: ${w}`)];
        
        const newCategoryScore = {
            name: "Live Coding Assignment",
            score: evaluation.score,
            comment: evaluation.feedback
        };

        const existingCategoryScores = existingFeedback.categoryScores || [];

        // Update feedback
        await feedbackDoc.ref.update({
          strengths: existingStrengths,
          areasForImprovement: existingAreas,
          categoryScores: [...existingCategoryScores, newCategoryScore],
          totalScore: Math.round(((existingFeedback.totalScore * existingCategoryScores.length) + evaluation.score) / (existingCategoryScores.length + 1))
        });
      }

      return Response.json({ success: true, evaluation }, { status: 200 });
    }

    return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Coding evaluate Error:", error);
    return Response.json({ success: false, error: "Evaluation failed" }, { status: 500 });
  }
}
