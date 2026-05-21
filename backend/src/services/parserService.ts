
import { PDFParse } from 'pdf-parse';
import { readFileSync } from 'fs';
const mammoth = require('mammoth');

// Helper to extract text from a PDF buffer
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

// Helper to extract text from a DOCX buffer
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  if (!file) {
    throw new Error('No file provided.');
  }

  const { mimetype, buffer } = file;

  if (mimetype === 'application/pdf') {
    return extractTextFromPDF(buffer);
  }

  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractTextFromDOCX(buffer);
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
}
