package com.biblioteca.config;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.io.InputStream;
import java.util.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
public class MailConfig {

  private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

  @Value("${spring.mail.host:smtp.gmail.com}")
  private String host;

  @Value("${spring.mail.port:465}")
  private int port;

  @Value("${spring.mail.username:}")
  private String username;

  @Value("${spring.mail.password:}")
  private String password;

  @Value("${app.mail.mock:false}")
  private boolean mockEnabled;

  @Bean
  public JavaMailSender javaMailSender() {
    boolean hostResolvable = isHostResolvable(host);

    if (mockEnabled || !hostResolvable) {
      log.info("Mode email simulé (MOCK) activé. Les emails seront affichés dans la console sans envoi réel.");
      return new MockMailSender();
    }

    log.info("Mode email réel activé. Connexion à {}:{}", host, port);
    JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
    mailSender.setHost(host);
    mailSender.setPort(port);
    mailSender.setUsername(username);
    mailSender.setPassword(password);

    Properties props = mailSender.getJavaMailProperties();
    props.put("mail.transport.protocol", "smtp");
    props.put("mail.smtp.auth", "true");
    props.put("mail.smtp.socketFactory.port", String.valueOf(port));
    props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
    props.put("mail.smtp.socketFactory.fallback", "false");
    props.put("mail.smtp.connectiontimeout", "5000");
    props.put("mail.smtp.timeout", "5000");
    props.put("mail.smtp.writetimeout", "5000");

    return mailSender;
  }

  private boolean isHostResolvable(String host) {
    try {
      java.net.InetAddress.getByName(host);
      return true;
    } catch (java.net.UnknownHostException e) {
      log.warn("Impossible de résoudre l'hôte du serveur de messagerie ({}). Le système bascule automatiquement en mode MOCK.", host);
      return false;
    }
  }

  public static class MockMailSender implements JavaMailSender {
    private static final Logger mockLog = LoggerFactory.getLogger(MockMailSender.class);

    @Override
    public MimeMessage createMimeMessage() {
      return new MimeMessage(Session.getInstance(new Properties()));
    }

    @Override
    public MimeMessage createMimeMessage(InputStream contentStream) throws MailException {
      try {
        return new MimeMessage(Session.getInstance(new Properties()), contentStream);
      } catch (Exception e) {
        throw new RuntimeException("Erreur de création du message simulé", e);
      }
    }

    @Override
    public void send(MimeMessage mimeMessage) throws MailException {
      try {
        mockLog.info("========================================= MOCK EMAIL =========================================");
        mockLog.info("Sujet         : {}", mimeMessage.getSubject());
        mockLog.info("Destinataire  : {}", (Object[]) mimeMessage.getAllRecipients());
        mockLog.info("Contenu (HTML): \n{}", mimeMessage.getContent());
        mockLog.info("==============================================================================================");
      } catch (Exception e) {
        mockLog.error("Erreur lors de l'affichage de l'email simulé", e);
      }
    }

    @Override
    public void send(MimeMessage... mimeMessages) throws MailException {
      for (MimeMessage msg : mimeMessages) {
        send(msg);
      }
    }

    @Override
    public void send(SimpleMailMessage simpleMessage) throws MailException {
      mockLog.info("====================================== MOCK SIMPLE EMAIL =====================================");
      mockLog.info("Sujet      : {}", simpleMessage.getSubject());
      mockLog.info("À          : {}", (Object[]) simpleMessage.getTo());
      mockLog.info("Contenu    : {}", simpleMessage.getText());
      mockLog.info("==============================================================================================");
    }

    @Override
    public void send(SimpleMailMessage... simpleMessages) throws MailException {
      for (SimpleMailMessage msg : simpleMessages) {
        send(msg);
      }
    }
  }
}
