package com.biblioteca.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;

/**
 * Middleware de sécurité pour le webhook CinetPay.
 *
 * Protections appliquées :
 * 1. Validation du site_id dans le payload
 * 2. Whitelist des IPs CinetPay connues
 * 3. Rate limiting (max 30 appels/minute par IP)
 * 4. Rejet des requêtes sans paramètres obligatoires
 */
@Component
@Slf4j
public class CinetPayWebhookFilter implements Filter {

    @Value("${cinetpay.site-id}")
    private String expectedSiteId;

    @Value("${cinetpay.webhook.ip-whitelist-enabled:true}")
    private boolean ipWhitelistEnabled;

    // IPs officielles CinetPay (à mettre à jour si CinetPay les change)
    private static final Set<String> CINETPAY_IPS = Set.of(
        "13.234.207.120",
        "13.127.185.82",
        "52.66.9.46",
        "35.154.246.141",
        "13.232.8.4",
        "127.0.0.1",   // local dev
        "0:0:0:0:0:0:0:1" // localhost IPv6
    );

    // Rate limiting simple en mémoire : IP → [timestamp, count]
    private final java.util.concurrent.ConcurrentHashMap<String, long[]> rateLimitMap =
        new java.util.concurrent.ConcurrentHashMap<>();
    private static final int MAX_CALLS_PER_MINUTE = 30;

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        // Appliquer uniquement sur /api/cinetpay/notify
        if (!request.getRequestURI().endsWith("/api/cinetpay/notify")) {
            chain.doFilter(req, res);
            return;
        }

        String clientIp = getClientIp(request);

        // 1. Whitelist IP
        if (ipWhitelistEnabled && !CINETPAY_IPS.contains(clientIp)) {
            log.warn("[CinetPay-Webhook] IP non autorisée: {}", clientIp);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("{\"error\":\"IP non autorisee\"}");
            return;
        }

        // 2. Rate limiting
        if (!checkRateLimit(clientIp)) {
            log.warn("[CinetPay-Webhook] Rate limit dépassé pour IP: {}", clientIp);
            response.setStatus(429);
            response.getWriter().write("{\"error\":\"Trop de requetes\"}");
            return;
        }

        // 3. Paramètres obligatoires
        String transactionId = request.getParameter("cpm_trans_id");
        String siteId        = request.getParameter("cpm_site_id");
        String result        = request.getParameter("cpm_result");

        if (transactionId == null || transactionId.isBlank()) {
            log.warn("[CinetPay-Webhook] Paramètre cpm_trans_id manquant — IP: {}", clientIp);
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\":\"cpm_trans_id manquant\"}");
            return;
        }

        // 4. Validation du site_id
        if (siteId != null && !expectedSiteId.equals(siteId)) {
            log.warn("[CinetPay-Webhook] site_id invalide: {} — IP: {}", siteId, clientIp);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("{\"error\":\"site_id invalide\"}");
            return;
        }

        // 5. Validation format transaction_id (alphanumérique, 6-20 chars)
        if (!transactionId.matches("^[A-Z0-9]{6,20}$")) {
            log.warn("[CinetPay-Webhook] Format transaction_id invalide: {}", transactionId);
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\":\"Format transaction_id invalide\"}");
            return;
        }

        log.info("[CinetPay-Webhook] Requête valide — IP={} transactionId={} result={}",
            clientIp, transactionId, result);

        chain.doFilter(req, res);
    }

    private boolean checkRateLimit(String ip) {
        long now = System.currentTimeMillis();
        long windowMs = 60_000L;
        rateLimitMap.compute(ip, (k, v) -> {
            if (v == null || now - v[0] > windowMs) return new long[]{now, 1};
            v[1]++;
            return v;
        });
        long[] entry = rateLimitMap.get(ip);
        return entry[1] <= MAX_CALLS_PER_MINUTE;
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) return realIp.trim();
        return request.getRemoteAddr();
    }
}
