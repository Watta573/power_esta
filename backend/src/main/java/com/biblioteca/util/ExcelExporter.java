package com.biblioteca.util;

import java.io.ByteArrayOutputStream;
import java.util.List;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

public final class ExcelExporter {
  private ExcelExporter() {
  }

  public static byte[] genererFichier(List<?> data, List<String> colonnes) {
    try (XSSFWorkbook wb = new XSSFWorkbook()) {
      XSSFSheet sheet = wb.createSheet("Rapport");
      Row header = sheet.createRow(0);
      for (int i = 0; i < colonnes.size(); i++) {
        header.createCell(i).setCellValue(colonnes.get(i));
      }
      for (int i = 0; i < data.size(); i++) {
        Row r = sheet.createRow(i + 1);
        r.createCell(0).setCellValue(String.valueOf(data.get(i)));
      }
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      wb.write(out);
      return out.toByteArray();
    } catch (Exception e) {
      throw new RuntimeException("Generation Excel impossible", e);
    }
  }
}

