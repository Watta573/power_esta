package com.biblioteca.util;

import jakarta.servlet.http.HttpServletRequest;

public final class IpUtils {

  private static final String[] IP_HEADERS = {
      "X-Forwarded-For",
      "X-Real-IP",
      "Proxy-Client-IP",
      "WL-Proxy-Client-IP",
      "HTTP_X_FORWARDED_FOR",
      "HTTP_CLIENT_IP"
  };

  private IpUtils() {}

  public static String getClientIp(HttpServletRequest request) {
    for (String header : IP_HEADERS) {
      String ip = request.getHeader(header);
      if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
        return normalize(ip.split(",")[0].trim());
      }
    }
    return normalize(request.getRemoteAddr());
  }

  private static String normalize(String ip) {
    // IPv6 loopback → IPv4
    if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) return "127.0.0.1";
    // Supprimer le scope IPv6 ex: fe80::1%eth0
    int scope = ip.indexOf('%');
    return scope != -1 ? ip.substring(0, scope) : ip;
  }
}
