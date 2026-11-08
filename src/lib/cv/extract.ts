import "server-only";

export const MAX_BYTES = 4 * 1024 * 1024; // Vercel request bodies are limited to ~4.5 MB
const MAX_CHARS = 60_000;

export class CvError extends Error {}

function clean(t: string) {
  return t.normalize("NFC").replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, MAX_CHARS);
}

/** Extracts text from PDF / DOCX / TXT after checking file signatures (not just the extension). */
export async function extractText(buf: Buffer, fileName: string): Promise<string> {
  if (buf.length === 0) throw new CvError("The file is empty.");
  if (buf.length > MAX_BYTES) throw new CvError("The file is larger than 4 MB. Please upload a smaller file or paste the text.");
  const name = fileName.toLowerCase();
  let text = "";
  if (buf.subarray(0, 5).toString("latin1") === "%PDF-") {
    try {
      const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      const r = await pdfText(pdf, { mergePages: true });
      text = Array.isArray(r.text) ? r.text.join("\n") : r.text;
    } catch {
      throw new CvError("We could not read this PDF. It may be protected or damaged. Try another file, or paste the text.");
    }
  } else if (buf.subarray(0, 2).toString("latin1") === "PK" && name.endsWith(".docx")) {
    try {
      const mammoth = await import("mammoth");
      text = (await mammoth.extractRawText({ buffer: buf })).value;
    } catch {
      throw new CvError("We could not read this Word file. Try saving it as PDF, or paste the text.");
    }
  } else if (name.endsWith(".txt") || name.endsWith(".md")) {
    text = buf.toString("utf8");
  } else {
    throw new CvError("Unsupported file. Upload a PDF, DOCX or TXT file, or paste your CV text.");
  }
  text = clean(text);
  if (text.length < 80) {
    throw new CvError("We found almost no text. If this is a scanned image or a PDF with unusual fonts, please paste the text of your CV instead.");
  }
  return text;
}

export function cleanPasted(t: string) {
  const text = clean(t);
  if (text.length < 80) throw new CvError("Please paste at least a few lines of your CV.");
  return text;
}
