package com.biblioteca.repository;

import com.biblioteca.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
  Page<AuditLog> findByEmailContainingIgnoreCaseOrActionContainingIgnoreCase(
      String email, String action, Pageable pageable);
  Page<AuditLog> findAllByOrderByDateActionDesc(Pageable pageable);
}
