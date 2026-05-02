package com.biblioteca.security;

import com.biblioteca.service.PermissionService;
import com.biblioteca.service.UtilisateurService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Intercepteur HTTP pour vérifier automatiquement les permissions
 * sur TOUS les endpoints de l'API
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PermissionInterceptor implements HandlerInterceptor {
    
    private final PermissionService permissionService;
    private final UtilisateurService utilisateurService;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String method = request.getMethod();
        String path = request.getRequestURI();
        
        // Ignorer les endpoints publics
        if (isPublicEndpoint(path)) {
            return true;
        }
        
        // Ignorer les requêtes OPTIONS (CORS preflight)
        if ("OPTIONS".equals(method)) {
            return true;
        }
        
        // Vérifier l'authentification
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("Tentative d'accès non authentifié à {} {}", method, path);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
        
        // Obtenir la permission requise
        String requiredPermission = PermissionMapping.getRequiredPermission(method, path);
        if (requiredPermission == null) {
            // Pas de permission spécifique requise, laisser passer
            return true;
        }
        
        try {
            // Vérifier la permission
            String email = authentication.getName();
            var utilisateur = utilisateurService.getByEmail(email);
            
            boolean hasPermission = permissionService.hasPermission(utilisateur.getId(), requiredPermission);
            
            if (!hasPermission) {
                log.warn("Accès refusé pour {} à {} {} - Permission requise: {}", 
                    email, method, path, requiredPermission);
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write(String.format(
                    "{\"message\":\"Accès refusé\",\"permission\":\"%s\",\"status\":403}", 
                    requiredPermission
                ));
                return false;
            }
            
            log.debug("Accès autorisé pour {} à {} {} avec permission {}", 
                email, method, path, requiredPermission);
            return true;
            
        } catch (Exception e) {
            log.error("Erreur lors de la vérification des permissions pour {} {}: {}", 
                method, path, e.getMessage());
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return false;
        }
    }
    
    /**
     * Vérifie si un endpoint est public (pas de vérification de permissions)
     */
    private boolean isPublicEndpoint(String path) {
        return path.startsWith("/api/auth/") ||
               path.startsWith("/uploads/") ||
               path.equals("/api/health") ||
               path.equals("/api/version") ||
               path.startsWith("/actuator/");
    }
}