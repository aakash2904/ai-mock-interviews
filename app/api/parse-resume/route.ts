import { NextRequest, NextResponse } from "next/server";
const PDFParser = require("pdf2json");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ success: false, message: "No file found." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return await new Promise((resolve) => {
      const pdfParser = new PDFParser(null, 1);
      
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        console.error("PDF Parsing Error:", errData.parserError);
        resolve(NextResponse.json({ 
          success: false, 
          text: "",
          message: "Failed to process the PDF file. It might be corrupted."
        }, { status: 500 }));
      });

      pdfParser.on("pdfParser_dataReady", () => {
        const textStr = pdfParser.getRawTextContent() || "";
        resolve(NextResponse.json({ 
          success: true, 
          text: textStr.replace(/\r\n/g, " "),
          message: "Resume processed successfully."
        }));
      });

      pdfParser.parseBuffer(buffer);
    });
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return NextResponse.json({ 
      success: false, 
      text: "",
      message: "Failed to process the PDF file. It might be corrupted or protected."
    }, { status: 500 });
  }
}
