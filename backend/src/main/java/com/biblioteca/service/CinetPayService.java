package com.biblioteca.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Slf4j
public class CinetPayService {

    @Value("${cinetpay.api-key}")
    private String apiKey;

    @Value("${cinetpay.site-id}")
    private String siteId;

    @Value("${cinetpay.base-url:https://api.cinetpay.net}")
    private String baseUrl;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    @Value("${cinetpay.timeout-ms:10000}")
    private int timeoutMs;

    @Value("${cinetpay.max-retries:3}")
    private int maxRetries;

    // ─── Circuit breaker simple ───────────────────────────────────────────────
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private final AtomicLong lastFailureTime = new AtomicLong(0);
    private static final int CIRCUIT_OPEN_THRESHOLD = 5;
    private static final long CIRCUIT_RESET_MS = 60_000L;

    private final ObjectMapper mapper = new ObjectMapper();

    // ─── RestTemplate avec timeout ────────────────────────────────────────────

    private RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        return new RestTemplate(factory);
    }

    // ─── Records ──────────────────────────────────────────────────────────────

    public record PaiementInitie(String paymentUrl, String transactionId, String code, String message) {}
    public record StatutPaiement(boolean success, String status, String message) {}

    // ─── Initier un paiement ──────────────────────────────────────────────────

    public PaiementInitie initierPaiement(String transactionId, double montant,
                                           String description, String customerName,
                                           String customerEmail, String customerPhone) {
        if (isCircuitOpen()) {
            log.error("[CinetPay] Circuit ouvert — service temporairement indisponible");
            return new PaiementInitie(null, transactionId, "503", "Service temporairement indisponible");
        }

        // Validation des entrées
        if (transactionId == null || transactionId.isBlank()) {
            return new PaiementInitie(null, transactionId, "400", "transactionId invalide");
        }
        if (montant <= 0 || montant > 10_000_000) {
            return new PaiementInitie(null, transactionId, "400", "Montant invalide");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("apikey", apiKey);
        body.put("site_id", siteId);
        body.put("transaction_id", transactionId);
        body.put("amount", (int) montant);
        body.put("currency", "XOF");
        body.put("description", sanitize(description));
        body.put("return_url", frontendUrl + "/abonnement?payment=success&tid=" + transactionId);
        body.put("notify_url", backendUrl + "/api/cinetpay/notify");
        body.put("channels", "MOBILE_MONEY");
        body.put("lang", "fr");
        body.put("customer_name", sanitize(customerName));
        body.put("customer_email", sanitize(customerEmail));
        if (customerPhone != null && !customerPhone.isBlank()) {
            body.put("customer_phone_number", sanitize(customerPhone));
        }

        // Log sans credentials sensibles
        log.info("[CinetPay] Initiation paiement — transactionId={} montant={} customer={}",
            transactionId, montant, maskEmail(customerEmail));

        return executeWithRetry(() -> {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = buildRestTemplate()
                .postForEntity(baseUrl + "/v2/payment", request, String.class);

            JsonNode json = mapper.readTree(response.getBody());
            String code = json.path("code").asText();
            String message = json.path("message").asText();

            if ("201".equals(code)) {
                String paymentUrl = json.path("data").path("payment_url").asText();
                recordSuccess();
                log.info("[CinetPay] Paiement initié avec succès — transactionId={}", transactionId);
                return new PaiementInitie(paymentUrl, transactionId, code, message);
            }

            log.error("[CinetPay] Erreur initiation — code={} message={}", code, message);
            return new PaiementInitie(null, transactionId, code, message);

        }, transactionId);
    }

    // ─── Vérifier le statut d'un paiement ────────────────────────────────────

    public StatutPaiement verifierPaiement(String transactionId) {
        if (isCircuitOpen()) {
            log.error("[CinetPay] Circuit ouvert — vérification impossible");
            return new StatutPaiement(false, "CIRCUIT_OPEN", "Service temporairement indisponible");
        }

        if (transactionId == null || !transactionId.matches("^[A-Z0-9]{6,20}$")) {
            return new StatutPaiement(false, "INVALID", "transactionId invalide");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("apikey", apiKey);
        body.put("site_id", siteId);
        body.put("transaction_id", transactionId);

        log.info("[CinetPay] Vérification paiement — transactionId={}", transactionId);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = buildRestTemplate()
                .postForEntity(baseUrl + "/v2/payment/check", request, String.class);

            JsonNode json = mapper.readTree(response.getBody());
            String code   = json.path("code").asText();
            String status = json.path("data").path("status").asText();

            // api.cinetpay.net retourne "00" pour succès
            boolean success = "00".equals(code) && ("ACCEPTED".equals(status) || "PAID".equals(status));
            if (success) recordSuccess();

            log.info("[CinetPay] Statut paiement — transactionId={} code={} status={}",
                transactionId, code, status);

            return new StatutPaiement(success, status, json.path("message").asText());

        } catch (Exception e) {
            recordFailure();
            log.error("[CinetPay] Erreur vérification — transactionId={} error={}", transactionId, e.getMessage());
            return new StatutPaiement(false, "ERROR", "Erreur de communication avec CinetPay");
        }
    }

    // ─── Retry avec backoff exponentiel ──────────────────────────────────────

    @FunctionalInterface
    private interface CinetPayCall<T> {
        T execute() throws Exception;
    }

    private PaiementInitie executeWithRetry(CinetPayCall<PaiementInitie> call, String transactionId) {
        int attempt = 0;
        while (attempt < maxRetries) {
            try {
                return call.execute();
            } catch (Exception e) {
                attempt++;
                recordFailure();
                log.warn("[CinetPay] Tentative {}/{} échouée — transactionId={} error={}",
                    attempt, maxRetries, transactionId, e.getMessage());
                if (attempt < maxRetries) {
                    long delay = (long) Math.pow(2, attempt) * 500L; // 1s, 2s, 4s
                    try { Thread.sleep(delay); } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
        return new PaiementInitie(null, transactionId, "500", "Échec après " + maxRetries + " tentatives");
    }

    // ─── Circuit breaker ──────────────────────────────────────────────────────

    private boolean isCircuitOpen() {
        if (failureCount.get() >= CIRCUIT_OPEN_THRESHOLD) {
            long elapsed = System.currentTimeMillis() - lastFailureTime.get();
            if (elapsed < CIRCUIT_RESET_MS) return true;
            // Reset après la fenêtre
            failureCount.set(0);
            log.info("[CinetPay] Circuit réinitialisé");
        }
        return false;
    }

    private void recordFailure() {
        failureCount.incrementAndGet();
        lastFailureTime.set(System.currentTimeMillis());
    }

    private void recordSuccess() {
        failureCount.set(0);
    }

    // ─── Utilitaires ─────────────────────────────────────────────────────────

    private String sanitize(String input) {
        if (input == null) return "";
        return input.replaceAll("[<>\"'%;()&+]", "").trim();
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@");
        String local = parts[0];
        return (local.length() > 2 ? local.substring(0, 2) : local) + "***@" + parts[1];
    }
}
