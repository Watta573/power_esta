package com.biblioteca.service;

import com.biblioteca.entity.Cotisation;
import com.biblioteca.entity.Utilisateur;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class ReceiptPdfService {

    private static final BaseColor HEADER_COLOR = new BaseColor(27, 67, 50);
    private static final BaseColor ACCENT_COLOR = new BaseColor(233, 196, 106);
    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BaseColor.WHITE);
    private static final Font HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, HEADER_COLOR);
    private static final Font NORMAL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.BLACK);
    private static final Font SMALL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 8, BaseColor.GRAY);

    public byte[] generateCotisationReceipt(Cotisation cotisation, Utilisateur exporteur) {
        try {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, baos);
            
            document.open();
            
            // En-tête
            addHeader(document, cotisation);
            
            // Informations adhérent
            addMemberInfo(document, cotisation);
            
            // Détails cotisation
            addCotisationDetails(document, cotisation);
            
            // Pied de page
            addFooter(document, exporteur);
            
            document.close();
            return baos.toByteArray();
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }

    private void addHeader(Document document, Cotisation cotisation) throws DocumentException {
        // Bandeau header
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingAfter(20);
        
        PdfPCell titleCell = new PdfPCell();
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setBackgroundColor(HEADER_COLOR);
        titleCell.setPadding(15);
        
        Paragraph title = new Paragraph();
        title.add(new Chunk("Bibliothèque ESTA", TITLE_FONT));
        title.add(Chunk.NEWLINE);
        title.add(new Chunk("Système de gestion de bibliothèque universitaire",
                           FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.WHITE)));
        titleCell.addElement(title);
        
        PdfPCell receiptCell = new PdfPCell();
        receiptCell.setBorder(Rectangle.NO_BORDER);
        receiptCell.setBackgroundColor(HEADER_COLOR);
        receiptCell.setPadding(15);
        receiptCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        
        Paragraph receiptNum = new Paragraph("REÇU DE COTISATION", 
                                           FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE));
        receiptNum.add(Chunk.NEWLINE);
        receiptNum.add(new Chunk(String.format("N° COT-%06d", cotisation.getId()), 
                                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.WHITE)));
        receiptCell.addElement(receiptNum);
        
        headerTable.addCell(titleCell);
        headerTable.addCell(receiptCell);
        document.add(headerTable);
        
        // Date d'export
        Paragraph exportInfo = new Paragraph(
            "Exporté le : " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")), 
            SMALL_FONT);
        exportInfo.setSpacingAfter(20);
        document.add(exportInfo);
    }

    private void addMemberInfo(Document document, Cotisation cotisation) throws DocumentException {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15);
        
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(new BaseColor(240, 253, 244));
        cell.setPadding(15);
        cell.setBorder(Rectangle.NO_BORDER);
        
        Paragraph header = new Paragraph("INFORMATIONS ADHÉRENT", HEADER_FONT);
        header.setSpacingAfter(10);
        cell.addElement(header);
        
        Paragraph info = new Paragraph();
        info.add(new Chunk("Nom : ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        info.add(new Chunk(cotisation.getUtilisateur().getPrenom() + " " + cotisation.getUtilisateur().getNom(), NORMAL_FONT));
        info.add(Chunk.NEWLINE);
        info.add(new Chunk("Email : ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        info.add(new Chunk(cotisation.getUtilisateur().getEmail(), NORMAL_FONT));
        info.add(Chunk.NEWLINE);
        info.add(new Chunk("Identifiant : ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        info.add(new Chunk(cotisation.getUtilisateur().getIdentifiant(), NORMAL_FONT));
        
        cell.addElement(info);
        table.addCell(cell);
        document.add(table);
    }

    private void addCotisationDetails(Document document, Cotisation cotisation) throws DocumentException {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15);
        
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(new BaseColor(239, 246, 255));
        cell.setPadding(15);
        cell.setBorder(Rectangle.NO_BORDER);
        
        Paragraph header = new Paragraph("DÉTAILS DE LA COTISATION", HEADER_FONT);
        header.setSpacingAfter(10);
        cell.addElement(header);
        
        Paragraph details = new Paragraph();
        details.add(new Chunk("Montant : ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        details.add(new Chunk(String.format("%.0f FCFA", cotisation.getMontant().doubleValue()), NORMAL_FONT));
        details.add(Chunk.NEWLINE);
        details.add(new Chunk("Période : ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        details.add(new Chunk(String.format("du %s au %s", cotisation.getDateDebut(), cotisation.getDateFin()), NORMAL_FONT));
        details.add(Chunk.NEWLINE);
        details.add(new Chunk("Date de paiement : ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        details.add(new Chunk(cotisation.getDatePaiement() != null ? cotisation.getDatePaiement().toString() : "Non définie", NORMAL_FONT));
        details.add(Chunk.NEWLINE);
        details.add(new Chunk("Statut : ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        details.add(new Chunk(cotisation.getStatut(), NORMAL_FONT));
        
        if (cotisation.getNotes() != null && !cotisation.getNotes().trim().isEmpty()) {
            details.add(Chunk.NEWLINE);
            details.add(new Chunk("Notes : ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
            details.add(new Chunk(cotisation.getNotes(), NORMAL_FONT));
        }
        
        cell.addElement(details);
        table.addCell(cell);
        document.add(table);
    }

    private void addFooter(Document document, Utilisateur exporteur) throws DocumentException {
        // Signature et cachet
        PdfPTable signatureTable = new PdfPTable(2);
        signatureTable.setWidthPercentage(100);
        signatureTable.setSpacingBefore(30);
        signatureTable.setSpacingAfter(20);
        
        // Signature adhérent — sans trait
        PdfPCell signatureCell = new PdfPCell();
        signatureCell.setBorder(Rectangle.NO_BORDER);
        signatureCell.setPadding(10);
        
        Paragraph signatureTitle = new Paragraph("Signature de l'adhérent", SMALL_FONT);
        signatureTitle.setSpacingAfter(40);
        signatureCell.addElement(signatureTitle);
        
        // Cachet de la bibliothèque avec logo
        PdfPCell cachetCell = new PdfPCell();
        cachetCell.setBorder(Rectangle.NO_BORDER);
        cachetCell.setPadding(10);
        cachetCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        
        Paragraph cachetTitle = new Paragraph("Cachet de la bibliothèque", SMALL_FONT);
        cachetTitle.setAlignment(Element.ALIGN_CENTER);
        cachetTitle.setSpacingAfter(10);
        cachetCell.addElement(cachetTitle);

        // Charger le cachet depuis les ressources
        try (InputStream is = new ClassPathResource("static/cachet_bibliotheque_ESTA.png").getInputStream()) {
            Image cachet = Image.getInstance(is.readAllBytes());
            cachet.scaleToFit(100, 100);
            cachet.setAlignment(Element.ALIGN_CENTER);
            cachetCell.addElement(cachet);
        } catch (Exception e) {
            PdfPTable cachetTable = new PdfPTable(1);
            cachetTable.setWidthPercentage(70);
            PdfPCell cachetContent = new PdfPCell();
            cachetContent.setBorder(Rectangle.BOX);
            cachetContent.setBorderWidth(2);
            cachetContent.setBorderColor(HEADER_COLOR);
            cachetContent.setPadding(8);
            cachetContent.setHorizontalAlignment(Element.ALIGN_CENTER);
            Paragraph cachetText = new Paragraph();
            cachetText.add(new Chunk("BIBLIOTHÈQUE ESTA", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, HEADER_COLOR)));
            cachetText.add(Chunk.NEWLINE);
            cachetText.add(new Chunk("OFFICIEL", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, HEADER_COLOR)));
            cachetText.setAlignment(Element.ALIGN_CENTER);
            cachetContent.addElement(cachetText);
            cachetTable.addCell(cachetContent);
            cachetCell.addElement(cachetTable);
        }
        
        signatureTable.addCell(signatureCell);
        signatureTable.addCell(cachetCell);
        document.add(signatureTable);
        
        // Pied de page
        Paragraph footer = new Paragraph(
            "Bibliothèque ESTA — Document généré automatiquement — Confidentiel", 
            SMALL_FONT);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(10);
        document.add(footer);
        
        if (exporteur != null) {
            Paragraph exporterInfo = new Paragraph(
                String.format("Exporté par : %s %s — %s (%s)", 
                    exporteur.getPrenom(), exporteur.getNom(), exporteur.getRole(), exporteur.getEmail()), 
                SMALL_FONT);
            exporterInfo.setAlignment(Element.ALIGN_CENTER);
            document.add(exporterInfo);
        }
    }
}