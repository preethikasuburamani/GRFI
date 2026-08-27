import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

/* =========================================================
   PDF Worker
========================================================= */

pdfjsLib.GlobalWorkerOptions.workerSrc =
  new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

/* =========================================================
   Extract PDF Text
========================================================= */

async function extractPdfText(
  file: File
): Promise<string> {

  const arrayBuffer =
    await file.arrayBuffer();

  const pdf =
    await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

  let fullText = "";

  for (
    let pageNumber = 1;
    pageNumber <= pdf.numPages;
    pageNumber++
  ) {

    const page =
      await pdf.getPage(
        pageNumber
      );

    const textContent =
      await page.getTextContent();

    const pageText =
      textContent.items
        .map((item) => {

          if (
            "str" in item &&
            typeof item.str === "string"
          ) {
            return item.str;
          }

          return "";

        })
        .join(" ");

    fullText +=
      pageText + "\n";
  }

  return fullText.trim();
}

/* =========================================================
   Extract DOCX Text
========================================================= */

async function extractDocxText(
  file: File
): Promise<string> {

  const arrayBuffer =
    await file.arrayBuffer();

  const result =
    await mammoth.extractRawText({
      arrayBuffer,
    });

  return result.value.trim();
}

/* =========================================================
   Main CV Text Extractor
========================================================= */

export async function extractCvText(
  file: File
): Promise<string> {

  const fileName =
    file.name.toLowerCase();

  /* =======================================================
     Validate File Size
  ======================================================= */

  const maxFileSize =
    10 * 1024 * 1024;

  if (
    file.size > maxFileSize
  ) {

    throw new Error(
      "CV file must be smaller than 10MB."
    );

  }

  /* =======================================================
     PDF
  ======================================================= */

  if (
    fileName.endsWith(".pdf")
  ) {

    const text =
      await extractPdfText(
        file
      );

    if (!text) {

      throw new Error(
        "We could not extract text from this PDF. Please make sure the PDF contains selectable text."
      );

    }

    return text;

  }

  /* =======================================================
     DOCX
  ======================================================= */

  if (
    fileName.endsWith(".docx")
  ) {

    const text =
      await extractDocxText(
        file
      );

    if (!text) {

      throw new Error(
        "We could not extract text from this DOCX file."
      );

    }

    return text;

  }

  /* =======================================================
     DOC
  ======================================================= */

  if (
    fileName.endsWith(".doc")
  ) {

    throw new Error(
      "Old .doc files are not currently supported. Please upload your CV as PDF or DOCX."
    );

  }

  /* =======================================================
     Unsupported File
  ======================================================= */

  throw new Error(
    "Unsupported CV format. Please upload a PDF or DOCX file."
  );
}