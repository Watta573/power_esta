package com.biblioteca.util;

import com.biblioteca.exception.BusinessException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

  private static final Map<String, String> ALLOWED_MIME_TO_EXT = Map.of(
      "image/jpeg", ".jpg",
      "image/png",  ".png",
      "image/webp", ".webp",
      "image/gif",  ".gif"
  );

  // Magic bytes : JPEG FF D8 FF, PNG 89 50 4E 47, WEBP 52 49 46 46, GIF 47 49 46 38
  private static final byte[][] MAGIC_BYTES = {
      new byte[]{(byte)0xFF, (byte)0xD8, (byte)0xFF},          // JPEG
      new byte[]{(byte)0x89, 0x50, 0x4E, 0x47},                // PNG
      new byte[]{0x52, 0x49, 0x46, 0x46},                      // WEBP (RIFF)
      new byte[]{0x47, 0x49, 0x46, 0x38}                       // GIF
  };

  private final Path root;

  public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
    this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
  }

  public String storeCouverture(MultipartFile file) throws IOException {
    if (file == null || file.isEmpty()) {
      return null;
    }

    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_MIME_TO_EXT.containsKey(contentType)) {
      throw new BusinessException("Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WEBP, GIF");
    }

    byte[] header = new byte[8];
    try (InputStream is = file.getInputStream()) {
      if (is.read(header) < 4) throw new BusinessException("Fichier invalide");
    }
    if (!matchesMagicBytes(header)) {
      throw new BusinessException("Contenu du fichier invalide ou corrompu");
    }

    String ext = ALLOWED_MIME_TO_EXT.get(contentType);
    String filename = UUID.randomUUID() + ext;
    Path dir = root.resolve("couvertures");
    Files.createDirectories(dir);
    Path target = dir.resolve(filename);
    Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
    return "/uploads/couvertures/" + filename;
  }

  private boolean matchesMagicBytes(byte[] header) {
    for (byte[] magic : MAGIC_BYTES) {
      boolean match = true;
      for (int i = 0; i < magic.length; i++) {
        if (header[i] != magic[i]) { match = false; break; }
      }
      if (match) return true;
    }
    return false;
  }
}

