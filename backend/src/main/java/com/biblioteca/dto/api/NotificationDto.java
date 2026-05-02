package com.biblioteca.dto.api;

import com.biblioteca.entity.enums.CanalNotification;
import com.biblioteca.entity.enums.TypeNotification;

public record NotificationDto(
    Long id,
    TypeNotification type,
    String message,
    String dateEnvoi,
    boolean lu,
    CanalNotification canal
) {}
