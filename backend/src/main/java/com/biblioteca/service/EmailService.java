package com.biblioteca.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

  private final JavaMailSender mailSender;

  @Value("${spring.mail.username}")
  private String fromEmail;

  private String logoBase64 = null;

  public EmailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
    // Charger le logo au démarrage
    try (java.io.InputStream is = getClass().getResourceAsStream("/static/logo_ESTA.png")) {
      if (is != null) {
        byte[] bytes = is.readAllBytes();
        logoBase64 = java.util.Base64.getEncoder().encodeToString(bytes);
      }
    } catch (Exception e) {
      System.err.println("Impossible de charger le logo email: " + e.getMessage());
    }
  }

  // ─── Template HTML de base ────────────────────────────────────────────────

  private String buildHtml(String titre, String contenu, String couleurAccent) {
    String logoHtml = "";
    if (logoBase64 != null) {
      logoHtml = "<img src='data:image/png;base64," + logoBase64 +
        "' alt='Logo ESTA' style='max-height:60px;max-width:180px;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;' />";
    }
    return "<!DOCTYPE html>" +
      "<html lang='fr'><head><meta charset='UTF-8'>" +
      "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
      "<title>" + titre + "</title></head>" +
      "<body style='margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;'>" +
      "<table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f6f9;padding:30px 0;'>" +
      "<tr><td align='center'>" +
      "<table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);'>" +
      "<tr><td style='background:" + couleurAccent + ";padding:28px 36px;text-align:center;'>" +
      logoHtml +
      "<h1 style='margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;'>Bibliotheque ESTA</h1>" +
      "<p style='margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;'>Systeme de Gestion de Bibliotheque Universitaire</p>" +
      "</td></tr>" +
      "<tr><td style='padding:36px;color:#374151;font-size:15px;line-height:1.7;'>" +
      contenu +
      "</td></tr>" +
      "<tr><td style='background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 36px;text-align:center;'>" +
      "<p style='margin:0;color:#9ca3af;font-size:12px;'>© 2025 Bibliotheque ESTA — Ecole Superieure de Technologie et d'Administration</p>" +
      "<p style='margin:6px 0 0;color:#9ca3af;font-size:11px;'>Cet email a ete envoye automatiquement, merci de ne pas y repondre directement.</p>" +
      "</td></tr>" +
      "</table></td></tr></table></body></html>";
  }

  private String bloc(String label, String valeur) {
    return "<tr>" +
      "<td style='padding:6px 0;color:#6b7280;font-size:13px;width:160px;'>" + label + "</td>" +
      "<td style='padding:6px 0;color:#111827;font-size:13px;font-weight:600;'>" + valeur + "</td>" +
      "</tr>";
  }

  private String tableau(String... lignes) {
    StringBuilder sb = new StringBuilder(
      "<table cellpadding='0' cellspacing='0' style='width:100%;background:#f9fafb;border-radius:8px;padding:16px 20px;margin:20px 0;border:1px solid #e5e7eb;'>"
    );
    for (String l : lignes) sb.append(l);
    sb.append("</table>");
    return sb.toString();
  }

  private String alerte(String texte, String couleurFond, String couleurTexte) {
    return "<div style='background:" + couleurFond + ";border-left:4px solid " + couleurTexte +
      ";border-radius:6px;padding:14px 18px;margin:20px 0;color:" + couleurTexte +
      ";font-size:13px;line-height:1.6;'>" + texte + "</div>";
  }

  // ─── Envoi generique ──────────────────────────────────────────────────────

  @Async
  public void sendSimpleEmail(String to, String subject, String htmlBody) {
    sendHtml(to, subject, htmlBody);
  }

  @Async
  public void sendHtml(String to, String subject, String html) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setFrom(fromEmail, "Bibliotheque ESTA");
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(html, true);
      mailSender.send(message);
    } catch (Exception e) {
      System.err.println("Erreur envoi email a " + to + ": " + e.getMessage());
    }
  }

  @Async
  public void sendEmailWithAttachment(String to, String subject, String htmlBody,
                                       byte[] attachment, String attachmentName) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setFrom(fromEmail, "Bibliotheque ESTA");
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(htmlBody, true);
      if (attachment != null && attachmentName != null) {
        helper.addAttachment(attachmentName, new ByteArrayResource(attachment));
      }
      mailSender.send(message);
    } catch (Exception e) {
      System.err.println("Erreur envoi email avec piece jointe a " + to + ": " + e.getMessage());
    }
  }

  // ─── Bienvenue ────────────────────────────────────────────────────────────

  @Async
  public void sendWelcomeEmail(String email, String userName) {
    String contenu =
      "<p>Bonjour <strong>" + userName + "</strong>,</p>" +
      "<p>Nous sommes ravis de vous accueillir sur la plateforme de la <strong>Bibliotheque ESTA</strong>. " +
      "Votre compte a ete cree avec succes.</p>" +
      alerte("Votre compte est actif. Vous pouvez des maintenant vous connecter et explorer notre catalogue.", "#f0fdf4", "#16a34a") +
      "<p style='margin:16px 0 8px;font-weight:600;color:#111827;'>Ce que vous pouvez faire :</p>" +
      "<ul style='margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2;'>" +
      "<li>Consulter et rechercher dans notre catalogue de livres</li>" +
      "<li>Effectuer des emprunts et des reservations</li>" +
      "<li>Souscrire a un abonnement adapte a vos besoins</li>" +
      "<li>Suivre vos emprunts et recevoir des rappels</li>" +
      "</ul>" +
      "<p style='margin-top:24px;'>Nous vous souhaitons une excellente experience de lecture.</p>" +
      "<p>Cordialement,<br><strong>L'equipe de la Bibliotheque ESTA</strong></p>";

    sendHtml(email, "Bienvenue a la Bibliotheque ESTA", buildHtml("Bienvenue", contenu, "#1b4332"));
  }

  // ─── Verification email ───────────────────────────────────────────────────

  @Async
  public void sendVerificationEmail(String email, String prenom, String verificationUrl) {
    String contenu =
      "<p>Bonjour <strong>" + prenom + "</strong>,</p>" +
      "<p>Pour finaliser la creation de votre compte, veuillez confirmer votre adresse email " +
      "en cliquant sur le lien ci-dessous.</p>" +
      "<p style='margin:20px 0;'><a href='" + verificationUrl +
      "' style='color:#1b4332;font-weight:700;word-break:break-all;'>" + verificationUrl + "</a></p>" +
      alerte("Ce lien est valable pendant <strong>24 heures</strong>. Passe ce delai, vous devrez en demander un nouveau.", "#fffbeb", "#d97706") +
      "<p style='color:#6b7280;font-size:13px;'>Si vous n'avez pas cree de compte sur la Bibliotheque ESTA, " +
      "ignorez simplement cet email.</p>" +
      "<p>Cordialement,<br><strong>L'equipe de la Bibliotheque ESTA</strong></p>";

    sendHtml(email, "Confirmez votre adresse email - Bibliotheque ESTA", buildHtml("Verification", contenu, "#1b4332"));
  }

  // ─── Recu de cotisation ───────────────────────────────────────────────────

  @Async
  public void sendCotisationReceipt(String email, String userName, byte[] receiptPdf,
                                     double montant, String dateDebut, String dateFin) {
    String contenu =
      "<p>Bonjour <strong>" + userName + "</strong>,</p>" +
      "<p>Votre abonnement a la <strong>Bibliotheque ESTA</strong> a ete valide avec succes. " +
      "Veuillez trouver ci-joint votre recu officiel de cotisation.</p>" +
      alerte("Votre abonnement est maintenant actif. Vous pouvez emprunter des livres des aujourd'hui.", "#f0fdf4", "#16a34a") +
      "<p style='margin:16px 0 8px;font-weight:600;color:#111827;'>Recapitulatif :</p>" +
      tableau(
        bloc("Montant paye", String.format("%.0f FCFA", montant)),
        bloc("Valable du", dateDebut),
        bloc("Valable au", dateFin)
      ) +
      "<p style='color:#6b7280;font-size:13px;'>Conservez ce recu comme justificatif de votre abonnement.</p>" +
      "<p>Nous vous remercions de votre confiance et vous souhaitons une excellente experience de lecture.</p>" +
      "<p>Cordialement,<br><strong>L'equipe de la Bibliotheque ESTA</strong></p>";

    sendEmailWithAttachment(email, "Votre recu de cotisation - Bibliotheque ESTA",
      buildHtml("Recu de cotisation", contenu, "#1b4332"), receiptPdf, "recu_cotisation_ESTA.pdf");
  }

  // ─── Confirmation de souscription ────────────────────────────────────────

  public String buildEmailSouscription(String prenom, String formule, double montant,
                                        String dateDebut, String dateFin, String code,
                                        String dateHeure) {
    String contenu =
      "<p>Bonjour <strong>" + prenom + "</strong>,</p>" +
      "<p>Votre demande d'abonnement a la <strong>Bibliotheque ESTA</strong> a bien ete enregistree. " +
      "Elle est actuellement en attente de validation par notre equipe.</p>" +
      alerte("Conservez votre code de reservation : <strong style='font-size:18px;letter-spacing:2px;'>" + code + "</strong><br>" +
        "Vous en aurez besoin lors de votre passage a la bibliotheque.", "#eff6ff", "#1d4ed8") +
      "<p style='margin:16px 0 8px;font-weight:600;color:#111827;'>Details de votre demande :</p>" +
      tableau(
        bloc("Formule", formule),
        bloc("Montant", String.format("%.0f FCFA", montant)),
        bloc("Periode", "du " + dateDebut + " au " + dateFin),
        bloc("Soumis le", dateHeure)
      ) +
      "<p style='margin-top:20px;'>Vous recevrez un email des que votre demande sera traitee. " +
      "En attendant, presentez-vous a la bibliotheque avec votre code et le montant exact.</p>" +
      "<p>Cordialement,<br><strong>L'equipe de la Bibliotheque ESTA</strong></p>";

    return buildHtml("Demande d'abonnement", contenu, "#1b4332");
  }

  // ─── Notification passer payer ────────────────────────────────────────────

  public String buildEmailNotifierPayer(String prenom, String formule, double montant, String code) {
    String contenu =
      "<p>Bonjour <strong>" + prenom + "</strong>,</p>" +
      "<p>Votre demande d'abonnement (formule <strong>" + formule + "</strong>) a ete examinee. " +
      "Vous etes invite(e) a vous presenter a la bibliotheque pour finaliser votre abonnement.</p>" +
      alerte("Presentez-vous au guichet de la Bibliotheque ESTA avec :<br>" +
        "- Votre code de reservation : <strong style='font-size:16px;letter-spacing:2px;'>" + code + "</strong><br>" +
        "- Le montant exact : <strong>" + String.format("%.0f FCFA", montant) + "</strong>", "#eff6ff", "#1d4ed8") +
      "<p style='margin-top:20px;color:#6b7280;font-size:13px;'>Horaires d'ouverture : Lundi - Vendredi, 08h00 - 17h00</p>" +
      "<p>Cordialement,<br><strong>L'equipe de la Bibliotheque ESTA</strong></p>";

    return buildHtml("Passage en bibliotheque requis", contenu, "#1b4332");
  }

  // ─── Confirmation finale abonnement ──────────────────────────────────────

  public String buildEmailConfirmationAbonnement(String prenom, String formule, double montant,
                                                   String dateDebut, String dateFin,
                                                   String code, String dateHeure, int maxEmprunts) {
    String contenu =
      "<p>Bonjour <strong>" + prenom + "</strong>,</p>" +
      "<p>Nous avons le plaisir de vous confirmer que votre abonnement a la " +
      "<strong>Bibliotheque ESTA</strong> a ete conclu avec succes.</p>" +
      alerte("Votre abonnement est actif. Vous pouvez emprunter jusqu'a <strong>" +
        maxEmprunts + " livre(s) simultanement</strong>.", "#f0fdf4", "#16a34a") +
      "<p style='margin:16px 0 8px;font-weight:600;color:#111827;'>Recapitulatif de votre abonnement :</p>" +
      tableau(
        bloc("Formule", formule),
        bloc("Montant paye", String.format("%.0f FCFA", montant)),
        bloc("Valable du", dateDebut),
        bloc("Valable au", dateFin),
        bloc("Code", code),
        bloc("Confirme le", dateHeure)
      ) +
      "<p style='margin-top:24px;'>Nous vous remercions sincerement de votre confiance et de votre fidelite " +
      "a la Bibliotheque ESTA. Notre equipe reste a votre entiere disposition pour tout renseignement " +
      "ou assistance dont vous pourriez avoir besoin.</p>" +
      "<p>Nous vous souhaitons une excellente experience de lecture et d'apprentissage.</p>" +
      "<p>Cordialement,<br><strong>L'equipe de la Bibliotheque ESTA</strong></p>";

    return buildHtml("Abonnement confirme", contenu, "#1b4332");
  }

  // ─── Relances expiration ──────────────────────────────────────────────────

  public String buildEmailRelanceExpiration(String prenom, String formule,
                                             String dateFin, int joursRestants) {
    boolean urgent = joursRestants <= 2;
    String couleur = urgent ? "#dc2626" : "#d97706";
    String couleurFond = urgent ? "#fef2f2" : "#fffbeb";

    String contenu =
      "<p>Bonjour <strong>" + prenom + "</strong>,</p>" +
      alerte("Votre abonnement <strong>" + formule + "</strong> expire le <strong>" + dateFin +
        "</strong>, soit dans <strong>" + joursRestants + " jour(s)</strong>.", couleurFond, couleur) +
      "<p>Pour continuer a profiter de nos services d'emprunt sans interruption, " +
      "nous vous invitons a renouveler votre abonnement avant cette date.</p>" +
      "<p style='margin:16px 0 8px;font-weight:600;color:#111827;'>Comment renouveler :</p>" +
      "<ol style='margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2;'>" +
      "<li>Connectez-vous a votre espace personnel</li>" +
      "<li>Rendez-vous dans la section <strong>Mon Abonnement</strong></li>" +
      "<li>Choisissez votre nouvelle formule et soumettez votre demande</li>" +
      "<li>Presentez-vous a la bibliotheque pour finaliser le paiement</li>" +
      "</ol>" +
      "<p style='margin-top:20px;'>Cordialement,<br><strong>L'equipe de la Bibliotheque ESTA</strong></p>";

    String sujet = urgent
      ? "Urgent - Votre abonnement expire dans " + joursRestants + " jour(s)"
      : "Rappel - Votre abonnement expire dans " + joursRestants + " jours";

    return buildHtml(sujet, contenu, urgent ? "#dc2626" : "#d97706");
  }

  public String buildEmailAbonnementExpire(String prenom, String formule, String dateFin) {
    String contenu =
      "<p>Bonjour <strong>" + prenom + "</strong>,</p>" +
      alerte("Votre abonnement <strong>" + formule + "</strong> a expire le <strong>" + dateFin +
        "</strong>. Vous ne pouvez plus effectuer de nouveaux emprunts.", "#fef2f2", "#dc2626") +
      "<p>Pour retrouver l'acces complet a nos services, souscrivez un nouvel abonnement " +
      "en vous rendant a la bibliotheque ou via votre espace personnel.</p>" +
      "<p>Nous esperons vous revoir tres prochainement.</p>" +
      "<p>Cordialement,<br><strong>L'equipe de la Bibliotheque ESTA</strong></p>";

    return buildHtml("Abonnement expire", contenu, "#dc2626");
  }

  public String buildEmailDemandeOubliee(String prenom, String formule,
                                          double montant, String code, String dateDebut) {
    String contenu =
      "<p>Bonjour <strong>" + prenom + "</strong>,</p>" +
      "<p>Nous vous rappelons que votre demande d'abonnement soumise le <strong>" + dateDebut +
      "</strong> est toujours en attente de validation.</p>" +
      alerte("Votre code de reservation : <strong style='font-size:16px;letter-spacing:2px;'>" + code + "</strong><br>" +
        "Formule : <strong>" + formule + "</strong> — Montant : <strong>" +
        String.format("%.0f FCFA", montant) + "</strong>", "#eff6ff", "#1d4ed8") +
      "<p>Pour finaliser votre abonnement, presentez-vous au guichet de la bibliotheque " +
      "avec votre code et le montant exact.</p>" +
      "<p style='color:#6b7280;font-size:13px;'>Si vous ne souhaitez plus souscrire cet abonnement, " +
      "vous pouvez annuler votre demande depuis votre espace personnel.</p>" +
      "<p>Cordialement,<br><strong>L'equipe de la Bibliotheque ESTA</strong></p>";

    return buildHtml("Rappel - Demande en attente", contenu, "#1b4332");
  }
}
