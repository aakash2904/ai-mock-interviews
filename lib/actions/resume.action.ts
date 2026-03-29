"use server";

// @ts-ignore
const pdfParse = require("pdf-parse");

export async function extractResumeText(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, text: "", message: "No file found." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the PDF buffer
    const pdfData = await pdfParse(buffer);
    
    return { 
      success: true, 
      text: pdfData.text,
      message: "Resume processed successfully."
    };
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return { 
      success: false, 
      text: "",
      message: "Failed to process the PDF file."
    };
  }
}
