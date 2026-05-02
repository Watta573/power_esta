package com.biblioteca.service;

import com.biblioteca.entity.Permission;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.entity.UtilisateurPermission;
import com.biblioteca.entity.enums.Role;
import com.biblioteca.repository.PermissionRepository;
import com.biblioteca.repository.UtilisateurPermissionRepository;
import com.biblioteca.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PermissionService {
    
    private final PermissionRepository permissionRepository;
    private final UtilisateurPermissionRepository utilisateurPermissionRepository;
    private final UtilisateurRepository utilisateurRepository;
    
    // Permissions par défaut selon le rôle - SYSTÈME COMPLET
    private static final Map<Role, Set<String>> DEFAULT_PERMISSIONS = Map.of(
        Role.ADMIN, Set.of(
            // Administration complète
            "ADMIN_USERS_VIEW", "ADMIN_USERS_CREATE", "ADMIN_USERS_EDIT", "ADMIN_USERS_DELETE", 
            "ADMIN_USERS_ACTIVATE", "ADMIN_ROLES_MANAGE", "ADMIN_PERMISSIONS_MANAGE", 
            "ADMIN_AUDIT_VIEW", "ADMIN_SYSTEM_CONFIG",
            
            // Livres et exemplaires
            "LIVRES_VIEW", "LIVRES_SEARCH", "LIVRES_CREATE", "LIVRES_EDIT", "LIVRES_DELETE", 
            "LIVRES_IMPORT", "LIVRES_EXPORT", "EXEMPLAIRES_VIEW", "EXEMPLAIRES_CREATE", 
            "EXEMPLAIRES_EDIT", "EXEMPLAIRES_DELETE", "EXEMPLAIRES_STATUS",
            
            // Emprunts et réservations
            "EMPRUNTS_VIEW", "EMPRUNTS_VIEW_ALL", "EMPRUNTS_CREATE", "EMPRUNTS_RETURN", 
            "EMPRUNTS_EXTEND", "EMPRUNTS_CANCEL", "EMPRUNTS_HISTORY", "EMPRUNTS_EXPORT",
            "RESERVATIONS_VIEW", "RESERVATIONS_VIEW_ALL", "RESERVATIONS_CREATE", 
            "RESERVATIONS_CANCEL", "RESERVATIONS_PROCESS", "RESERVATIONS_EXPORT",
            
            // Finances
            "FINANCES_VIEW", "FINANCES_AMENDES_VIEW", "FINANCES_AMENDES_COLLECT", 
            "FINANCES_COTISATIONS_VIEW", "FINANCES_COTISATIONS_CREATE", "FINANCES_COTISATIONS_EDIT", 
            "FINANCES_COTISATIONS_CANCEL", "FINANCES_REPORTS", "FINANCES_EXPORT",
            
            // Acquisitions
            "ACQUISITIONS_VIEW", "ACQUISITIONS_SUGGEST", "ACQUISITIONS_APPROVE", "ACQUISITIONS_REJECT",
            "ACQUISITIONS_ORDERS_VIEW", "ACQUISITIONS_ORDERS_CREATE", "ACQUISITIONS_ORDERS_EDIT", 
            "ACQUISITIONS_ORDERS_CANCEL", "ACQUISITIONS_DELIVERY", "ACQUISITIONS_BUDGET", "ACQUISITIONS_EXPORT",
            
            // Fournisseurs et périodiques
            "FOURNISSEURS_VIEW", "FOURNISSEURS_CREATE", "FOURNISSEURS_EDIT", "FOURNISSEURS_DELETE",
            "PERIODIQUES_VIEW", "PERIODIQUES_CREATE", "PERIODIQUES_EDIT", "PERIODIQUES_DELETE", "PERIODIQUES_NUMBERS_MANAGE",
            
            // Catégories et langues
            "CATEGORIES_VIEW", "CATEGORIES_CREATE", "CATEGORIES_EDIT", "CATEGORIES_DELETE",
            "LANGUES_VIEW", "LANGUES_CREATE", "LANGUES_EDIT", "LANGUES_DELETE",
            
            // Communication et rapports
            "COMMUNICATION_VIEW", "COMMUNICATION_SEND", "COMMUNICATION_BROADCAST", "COMMUNICATION_EMAIL", "COMMUNICATION_SMS",
            "REPORTS_VIEW", "REPORTS_DASHBOARD", "REPORTS_LOANS", "REPORTS_USERS", "REPORTS_FINANCIAL", 
            "REPORTS_INVENTORY", "REPORTS_EXPORT", "REPORTS_PRINT",
            
            // Relances et sécurité
            "RELANCES_VIEW", "RELANCES_SEND", "RELANCES_AUTO", "RELANCES_MANUAL",
            "SECURITY_2FA_MANAGE", "SECURITY_SESSIONS_VIEW", "SECURITY_SESSIONS_KILL", "SECURITY_LOGS_VIEW", "SECURITY_BACKUP",
            
            // Profil
            "PROFILE_VIEW", "PROFILE_EDIT", "PROFILE_PASSWORD", "PROFILE_2FA", "PROFILE_NOTIFICATIONS",
            
            // Export/Import et API
            "EXPORT_USERS", "EXPORT_BOOKS", "EXPORT_LOANS", "EXPORT_FINANCIAL", "IMPORT_BOOKS", "IMPORT_USERS",
            "API_ACCESS", "API_ADMIN", "API_READ_ONLY", "API_WRITE"
        ),
        
        Role.BIBLIOTHECAIRE, Set.of(
            // Livres et exemplaires
            "LIVRES_VIEW", "LIVRES_SEARCH", "LIVRES_CREATE", "LIVRES_EDIT", "LIVRES_EXPORT",
            "EXEMPLAIRES_VIEW", "EXEMPLAIRES_CREATE", "EXEMPLAIRES_EDIT", "EXEMPLAIRES_STATUS",
            
            // Emprunts et réservations
            "EMPRUNTS_VIEW", "EMPRUNTS_VIEW_ALL", "EMPRUNTS_CREATE", "EMPRUNTS_RETURN", 
            "EMPRUNTS_EXTEND", "EMPRUNTS_CANCEL", "EMPRUNTS_HISTORY", "EMPRUNTS_EXPORT",
            "RESERVATIONS_VIEW", "RESERVATIONS_VIEW_ALL", "RESERVATIONS_CREATE", 
            "RESERVATIONS_CANCEL", "RESERVATIONS_PROCESS", "RESERVATIONS_EXPORT",
            
            // Finances
            "FINANCES_VIEW", "FINANCES_AMENDES_VIEW", "FINANCES_AMENDES_COLLECT", 
            "FINANCES_COTISATIONS_VIEW", "FINANCES_COTISATIONS_CREATE", "FINANCES_COTISATIONS_EDIT", 
            "FINANCES_REPORTS", "FINANCES_EXPORT",
            
            // Acquisitions
            "ACQUISITIONS_VIEW", "ACQUISITIONS_SUGGEST", "ACQUISITIONS_APPROVE", "ACQUISITIONS_REJECT",
            "ACQUISITIONS_ORDERS_VIEW", "ACQUISITIONS_ORDERS_CREATE", "ACQUISITIONS_DELIVERY", "ACQUISITIONS_BUDGET",
            
            // Fournisseurs et périodiques
            "FOURNISSEURS_VIEW", "FOURNISSEURS_CREATE", "FOURNISSEURS_EDIT",
            "PERIODIQUES_VIEW", "PERIODIQUES_CREATE", "PERIODIQUES_EDIT", "PERIODIQUES_NUMBERS_MANAGE",
            
            // Catégories et langues
            "CATEGORIES_VIEW", "CATEGORIES_CREATE", "CATEGORIES_EDIT",
            "LANGUES_VIEW", "LANGUES_CREATE", "LANGUES_EDIT",
            
            // Communication et rapports
            "COMMUNICATION_VIEW", "COMMUNICATION_SEND", "COMMUNICATION_EMAIL",
            "REPORTS_VIEW", "REPORTS_DASHBOARD", "REPORTS_LOANS", "REPORTS_USERS", "REPORTS_FINANCIAL", 
            "REPORTS_INVENTORY", "REPORTS_EXPORT", "REPORTS_PRINT",
            
            // Relances
            "RELANCES_VIEW", "RELANCES_SEND", "RELANCES_MANUAL",
            
            // Profil
            "PROFILE_VIEW", "PROFILE_EDIT", "PROFILE_PASSWORD", "PROFILE_2FA", "PROFILE_NOTIFICATIONS",
            
            // Export/Import
            "EXPORT_BOOKS", "EXPORT_LOANS", "EXPORT_FINANCIAL", "IMPORT_BOOKS",
            "API_ACCESS", "API_READ_ONLY"
        ),
        
        Role.ENSEIGNANT, Set.of(
            // Livres (consultation)
            "LIVRES_VIEW", "LIVRES_SEARCH", "EXEMPLAIRES_VIEW",
            
            // Emprunts et réservations (ses propres)
            "EMPRUNTS_VIEW", "EMPRUNTS_HISTORY", "EMPRUNTS_CREATE",
            "RESERVATIONS_VIEW", "RESERVATIONS_CREATE", "RESERVATIONS_CANCEL",
            
            // Finances (consultation)
            "FINANCES_VIEW", "FINANCES_COTISATIONS_VIEW",
            
            // Acquisitions (suggestions)
            "ACQUISITIONS_VIEW", "ACQUISITIONS_SUGGEST",
            
            // Catégories et langues (consultation)
            "CATEGORIES_VIEW", "LANGUES_VIEW", "PERIODIQUES_VIEW",
            
            // Communication
            "COMMUNICATION_VIEW",
            
            // Profil
            "PROFILE_VIEW", "PROFILE_EDIT", "PROFILE_PASSWORD", "PROFILE_2FA", "PROFILE_NOTIFICATIONS",
            
            // API lecture seule
            "API_ACCESS", "API_READ_ONLY"
        ),
        
        Role.ETUDIANT, Set.of(
            // Livres (consultation)
            "LIVRES_VIEW", "LIVRES_SEARCH", "EXEMPLAIRES_VIEW",
            
            // Emprunts et réservations (ses propres)
            "EMPRUNTS_VIEW", "EMPRUNTS_HISTORY", "EMPRUNTS_CREATE",
            "RESERVATIONS_VIEW", "RESERVATIONS_CREATE", "RESERVATIONS_CANCEL",
            
            // Acquisitions (suggestions)
            "ACQUISITIONS_VIEW", "ACQUISITIONS_SUGGEST",
            
            // Catégories et langues (consultation)
            "CATEGORIES_VIEW", "LANGUES_VIEW", "PERIODIQUES_VIEW",
            
            // Communication
            "COMMUNICATION_VIEW",
            
            // Profil
            "PROFILE_VIEW", "PROFILE_EDIT", "PROFILE_PASSWORD", "PROFILE_2FA", "PROFILE_NOTIFICATIONS"
        ),
        
        Role.PUBLIC, Set.of(
            // Livres (consultation limitée)
            "LIVRES_VIEW", "LIVRES_SEARCH", "EXEMPLAIRES_VIEW",
            
            // Emprunts (ses propres)
            "EMPRUNTS_VIEW", "EMPRUNTS_HISTORY", "EMPRUNTS_CREATE",
            "RESERVATIONS_VIEW", "RESERVATIONS_CREATE", "RESERVATIONS_CANCEL",
            
            // Catégories (consultation)
            "CATEGORIES_VIEW", "PERIODIQUES_VIEW",
            
            // Communication
            "COMMUNICATION_VIEW",
            
            // Profil
            "PROFILE_VIEW", "PROFILE_EDIT", "PROFILE_PASSWORD", "PROFILE_NOTIFICATIONS"
        )
    );
    
    /**
     * Vérifie si un utilisateur a une permission spécifique
     */
    public boolean hasPermission(Long utilisateurId, String permissionCode) {
        // 1. Vérifier les permissions par rôle en premier (plus fiable)
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);
        if (utilisateur != null) {
            Set<String> rolePermissions = DEFAULT_PERMISSIONS.get(utilisateur.getRole());
            if (rolePermissions != null && rolePermissions.contains(permissionCode)) {
                return true;
            }
        }
        // 2. Vérifier les permissions personnalisées en base
        try {
            return utilisateurPermissionRepository.hasPermission(utilisateurId, permissionCode);
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Obtient toutes les permissions d'un utilisateur (rôle + personnalisées)
     */
    public List<String> getUserPermissions(Long utilisateurId) {
        List<String> customPermissions;
        try {
            customPermissions = utilisateurPermissionRepository.findPermissionCodesByUtilisateurId(utilisateurId);
        } catch (Exception e) {
            customPermissions = new java.util.ArrayList<>();
        }

        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId).orElse(null);
        if (utilisateur != null) {
            Set<String> rolePermissions = DEFAULT_PERMISSIONS.get(utilisateur.getRole());
            if (rolePermissions != null) {
                List<String> result = new java.util.ArrayList<>(customPermissions);
                result.addAll(rolePermissions);
                return result.stream().distinct().toList();
            }
        }

        return customPermissions.stream().distinct().toList();
    }
    
    /**
     * Accorde une permission à un utilisateur
     */
    @Transactional
    public void accorderPermission(Long utilisateurId, String permissionCode, Long accordeParId, String notes) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        
        Permission permission = permissionRepository.findByCode(permissionCode)
            .orElseThrow(() -> new RuntimeException("Permission introuvable"));
        
        Utilisateur accordePar = utilisateurRepository.findById(accordeParId)
            .orElseThrow(() -> new RuntimeException("Utilisateur accordant introuvable"));
        
        // Vérifier si la permission existe déjà
        UtilisateurPermission existante = utilisateurPermissionRepository
            .findByUtilisateurIdAndPermissionId(utilisateurId, permission.getId())
            .orElse(null);
        
        if (existante != null) {
            // Mettre à jour
            existante.setAccorde(true);
            existante.setDateAccord(LocalDateTime.now());
            existante.setAccordePar(accordePar);
            existante.setNotes(notes);
            utilisateurPermissionRepository.save(existante);
        } else {
            // Créer nouvelle
            UtilisateurPermission nouvellePermission = UtilisateurPermission.builder()
                .utilisateur(utilisateur)
                .permission(permission)
                .accorde(true)
                .dateAccord(LocalDateTime.now())
                .accordePar(accordePar)
                .notes(notes)
                .build();
            utilisateurPermissionRepository.save(nouvellePermission);
        }
    }
    
    /**
     * Révoque une permission d'un utilisateur
     */
    @Transactional
    public void revoquerPermission(Long utilisateurId, String permissionCode, Long revoqueParId, String notes) {
        Permission permission = permissionRepository.findByCode(permissionCode)
            .orElseThrow(() -> new RuntimeException("Permission introuvable"));
        
        UtilisateurPermission existante = utilisateurPermissionRepository
            .findByUtilisateurIdAndPermissionId(utilisateurId, permission.getId())
            .orElse(null);
        
        if (existante != null) {
            existante.setAccorde(false);
            existante.setDateAccord(LocalDateTime.now());
            existante.setAccordePar(utilisateurRepository.findById(revoqueParId).orElse(null));
            existante.setNotes(notes);
            utilisateurPermissionRepository.save(existante);
        }
    }
    
    /**
     * Obtient toutes les permissions disponibles
     */
    public List<Permission> getAllPermissions() {
        return permissionRepository.findByActifTrue();
    }
    
    /**
     * Obtient les permissions d'un module spécifique
     */
    public List<Permission> getPermissionsByModule(String module) {
        return permissionRepository.findByModuleAndActifTrue(module);
    }
}