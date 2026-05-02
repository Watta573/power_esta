package com.biblioteca.service;

import com.biblioteca.entity.AuditLog;
import com.biblioteca.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

  private final AuditLogRepository auditLogRepository;

  public AuditService(AuditLogRepository auditLogRepository) {
    this.auditLogRepository = auditLogRepository;
  }

  @Async
  public void log(Long utilisateurId, String email, String role,
                  String action, String details, String ip, String statut) {
    AuditLog log = AuditLog.builder()
        .utilisateurId(utilisateurId)
        .email(email)
        .role(role)
        .action(action)
        .details(details)
        .ipAddress(ip)
        .statut(statut)
        .build();
    auditLogRepository.save(log);
  }

  public Page<AuditLog> getAll(String q, int page, int size) {
    PageRequest pageable = PageRequest.of(
        Math.max(page, 0),
        Math.min(Math.max(size, 1), 100),
        Sort.by(Sort.Direction.DESC, "dateAction")
    );
    if (q == null || q.isBlank()) {
      return auditLogRepository.findAllByOrderByDateActionDesc(pageable);
    }
    return auditLogRepository.findByEmailContainingIgnoreCaseOrActionContainingIgnoreCase(q, q, pageable);
  }
}
