package com.biblioteca.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // Les permissions sont gérées par PermissionAspect (@RequirePermission) et Spring Security (@PreAuthorize)
}