package com.biblioteca.repository;

import com.biblioteca.entity.UtilisateurPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtilisateurPermissionRepository extends JpaRepository<UtilisateurPermission, Long> {
    
    @Query("SELECT up FROM UtilisateurPermission up JOIN FETCH up.permission WHERE up.utilisateur.id = :utilisateurId AND up.accorde = true")
    List<UtilisateurPermission> findByUtilisateurIdAndAccordeTrue(@Param("utilisateurId") Long utilisateurId);
    
    @Query("SELECT up.permission.code FROM UtilisateurPermission up WHERE up.utilisateur.id = :utilisateurId AND up.accorde = true")
    List<String> findPermissionCodesByUtilisateurId(@Param("utilisateurId") Long utilisateurId);
    
    Optional<UtilisateurPermission> findByUtilisateurIdAndPermissionId(Long utilisateurId, Long permissionId);
    
    @Query("SELECT COUNT(up) > 0 FROM UtilisateurPermission up WHERE up.utilisateur.id = :utilisateurId AND up.permission.code = :permissionCode AND up.accorde = true")
    boolean hasPermission(@Param("utilisateurId") Long utilisateurId, @Param("permissionCode") String permissionCode);
}