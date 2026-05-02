package com.biblioteca.controller.api;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

/**
 * Implémentation TOTP (RFC 6238) sans dépendance externe.
 * Compatible avec Google Authenticator, Authy, etc.
 */
class TotpUtil {

  private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  private static final int CODE_DIGITS = 6;
  private static final int TIME_STEP = 30;
  private static final int WINDOW = 1; // ±1 fenêtre de tolérance

  static String generateSecret() {
    byte[] bytes = new byte[20];
    new SecureRandom().nextBytes(bytes);
    return base32Encode(bytes);
  }

  static String getOtpAuthUrl(String secret, String email, String issuer) {
    return "otpauth://totp/" + encode(issuer + ":" + email)
        + "?secret=" + secret
        + "&issuer=" + encode(issuer)
        + "&algorithm=SHA1&digits=6&period=30";
  }

  static boolean verify(String secret, String code) {
    if (secret == null || code == null || code.length() != CODE_DIGITS) return false;
    try {
      long counter = Instant.now().getEpochSecond() / TIME_STEP;
      for (int i = -WINDOW; i <= WINDOW; i++) {
        if (generateCode(secret, counter + i).equals(code)) return true;
      }
    } catch (Exception ignored) {}
    return false;
  }

  private static String generateCode(String secret, long counter) throws Exception {
    byte[] key = base32Decode(secret);
    byte[] msg = new byte[8];
    for (int i = 7; i >= 0; i--) { msg[i] = (byte)(counter & 0xFF); counter >>= 8; }
    Mac mac = Mac.getInstance("HmacSHA1");
    mac.init(new SecretKeySpec(key, "HmacSHA1"));
    byte[] hash = mac.doFinal(msg);
    int offset = hash[hash.length - 1] & 0x0F;
    int code = ((hash[offset] & 0x7F) << 24)
             | ((hash[offset + 1] & 0xFF) << 16)
             | ((hash[offset + 2] & 0xFF) << 8)
             | (hash[offset + 3] & 0xFF);
    return String.format("%0" + CODE_DIGITS + "d", code % (int) Math.pow(10, CODE_DIGITS));
  }

  private static String base32Encode(byte[] data) {
    StringBuilder sb = new StringBuilder();
    int buffer = 0, bitsLeft = 0;
    for (byte b : data) {
      buffer = (buffer << 8) | (b & 0xFF);
      bitsLeft += 8;
      while (bitsLeft >= 5) {
        sb.append(BASE32_CHARS.charAt((buffer >> (bitsLeft - 5)) & 31));
        bitsLeft -= 5;
      }
    }
    if (bitsLeft > 0) sb.append(BASE32_CHARS.charAt((buffer << (5 - bitsLeft)) & 31));
    return sb.toString();
  }

  private static byte[] base32Decode(String s) {
    s = s.toUpperCase().replaceAll("[^A-Z2-7]", "");
    byte[] out = new byte[s.length() * 5 / 8];
    int buffer = 0, bitsLeft = 0, idx = 0;
    for (char c : s.toCharArray()) {
      buffer = (buffer << 5) | BASE32_CHARS.indexOf(c);
      bitsLeft += 5;
      if (bitsLeft >= 8) { out[idx++] = (byte)(buffer >> (bitsLeft - 8)); bitsLeft -= 8; }
    }
    return out;
  }

  private static String encode(String s) {
    return java.net.URLEncoder.encode(s, java.nio.charset.StandardCharsets.UTF_8);
  }
}
