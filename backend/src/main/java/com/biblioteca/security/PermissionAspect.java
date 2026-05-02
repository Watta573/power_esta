package com.biblioteca.security;

import com.biblioteca.service.PermissionService;
import com.biblioteca.service.UtilisateurService;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class PermissionAspect {
    
    private final PermissionService permissionService;
    private final UtilisateurService utilisateurService;
    
    @Around("@annotation(requirePermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint, RequirePermission requirePermission) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Non authentifié");
        }
        
        String email = authentication.getName();
        var utilisateur = utilisateurService.getByEmail(email);
        
        boolean hasPermission = permissionService.hasPermission(utilisateur.getId(), requirePermission.value());
        
        log.debug("[PERMISSION] user={} role={} permission={} granted={}",
            email, utilisateur.getRole(), requirePermission.value(), hasPermission);
        
        if (!hasPermission) {
            throw new AccessDeniedException(requirePermission.message());
        }
        
        return joinPoint.proceed();
    }
}