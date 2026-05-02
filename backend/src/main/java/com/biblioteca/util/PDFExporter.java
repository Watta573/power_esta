package com.biblioteca.util;

import com.itextpdf.text.Document;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.util.List;

public final class PDFExporter {
  private PDFExporter() {
  }

  public static byte[] genererRapport(List<?> data, String titre) {
    try {
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      Document doc = new Document();
      PdfWriter.getInstance(doc, out);
      doc.open();
      doc.add(new Paragraph(titre));
      doc.add(new Paragraph("Nombre de lignes: " + data.size()));
      for (Object o : data) {
        doc.add(new Paragraph(String.valueOf(o)));
      }
      doc.close();
      return out.toByteArray();
    } catch (Exception e) {
      throw new RuntimeException("Generation PDF impossible", e);
    }
  }
}
