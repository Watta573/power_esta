package com.biblioteca.controller;

import com.biblioteca.repository.EmpruntRepository;
import com.biblioteca.util.ExcelExporter;
import com.biblioteca.util.PDFExporter;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin/rapports")
public class RapportController {
  private final EmpruntRepository empruntRepository;

  public RapportController(EmpruntRepository empruntRepository) {
    this.empruntRepository = empruntRepository;
  }

  @GetMapping(value = "/emprunts/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public ResponseEntity<byte[]> exportPdf() {
    byte[] bytes = PDFExporter.genererRapport(empruntRepository.findAll(), "Rapport Emprunts");
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("rapport-emprunts.pdf").build().toString())
        .body(bytes);
  }

  @GetMapping(value = "/emprunts/excel", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  @PreAuthorize("hasAnyRole('ADMIN','BIBLIOTHECAIRE')")
  public ResponseEntity<byte[]> exportExcel() {
    byte[] bytes = ExcelExporter.genererFichier(empruntRepository.findAll(), List.of("Lignes"));
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("rapport-emprunts.xlsx").build().toString())
        .body(bytes);
  }
}

