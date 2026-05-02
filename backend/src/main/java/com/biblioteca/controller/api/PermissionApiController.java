package com.biblioteca.controller.api;

import com.biblioteca.entity.Permission;
import com.biblioteca.entity.Utilisateur;
import com.biblioteca.service.PermissionService;
import com.biblioteca.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = "/api/permissions", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class PermissionApiController {
    
    private final PermissionService permissionService;
    private final UtilisateurService utilisateurService;
    
    /**
     * Obtient toutes les permissions disponibles
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Permission> getAllPermissions() {
        return permissionService.getAllPermissions();
    }
    
    /**
     * Obtient les permissions d'un utilisateur
     */
    @GetMapping("/utilisateur/{utilisateurId}")
    @PreAuthorize("isAuthenticated()")
    public List<String> getUserPermissions(@PathVariable Long utilisateurId,
                                           @AuthenticationPrincipal String email) {
        Utilisateur caller = utilisateurService.getByEmail(email);
        if (!caller.getRole().name().equals("ADMIN") && !caller.getId().equals(utilisateurId)) {
            throw new com.biblioteca.exception.BusinessException("Accès non autorisé");
        }
        return permissionService.getUserPermissions(utilisateurId);
    }

    /**
     * Vérifie si un utilisateur a une permission
     */
    @GetMapping("/utilisateur/{utilisateurId}/has/{permissionCode}")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Boolean> hasPermission(@PathVariable Long utilisateurId,
                                              @PathVariable String permissionCode,
                                              @AuthenticationPrincipal String email) {
        Utilisateur caller = utilisateurService.getByEmail(email);
        if (!caller.getRole().name().equals("ADMIN") && !caller.getId().equals(utilisateurId)) {
            throw new com.biblioteca.exception.BusinessException("Accès non autorisé");
        }
        boolean hasPermission = permissionService.hasPermission(utilisateurId, permissionCode);
        return Map.of("hasPermission", hasPermission);
    }
    
    /**
     * Accorde une permission à un utilisateur
     */
    @PostMapping("/utilisateur/{utilisateurId}/accorder")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> accorderPermission(
            @PathVariable Long utilisateurId,
            @RequestBody AccorderPermissionRequest request,
            @AuthenticationPrincipal String email) {
        
        Utilisateur admin = utilisateurService.getByEmail(email);
        
        permissionService.accorderPermission(utilisateurId, request.permissionCode(), admin.getId(), request.notes());
        return Map.of("message", "Permission accordée avec succès");
    }
    
    /**
     * Révoque une permission d'un utilisateur
     */
    @PostMapping("/utilisateur/{utilisateurId}/revoquer")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> revoquerPermission(
            @PathVariable Long utilisateurId,
            @RequestBody RevoquerPermissionRequest request,
            @AuthenticationPrincipal String email) {
        
        Utilisateur admin = utilisateurService.getByEmail(email);
        
        permissionService.revoquerPermission(utilisateurId, request.permissionCode(), admin.getId(), request.notes());
        return Map.of("message", "Permission révoquée avec succès");
    }
    
    // DTOs
    public record AccorderPermissionRequest(String permissionCode, String notes) {}
    public record RevoquerPermissionRequest(String permissionCode, String notes) {}
}