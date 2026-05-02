package com.biblioteca.repository;

import com.biblioteca.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    
    Optional<Permission> findByCode(String code);
    
    List<Permission> findByModuleAndActifTrue(String module);
    
    List<Permission> findByActifTrue();
    
    @Query("SELECT p FROM Permission p WHERE p.code IN :codes AND p.actif = true")
    List<Permission> findByCodesAndActifTrue(@Param("codes") List<String> codes);
}