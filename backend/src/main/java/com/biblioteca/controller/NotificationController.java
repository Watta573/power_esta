package com.biblioteca.controller;

import com.biblioteca.service.NotificationService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class NotificationController {
  private final NotificationService notificationService;

  public NotificationController(NotificationService notificationService) {
    this.notificationService = notificationService;
  }

  @GetMapping("/notifications")
  public String list(@RequestParam Long utilisateurId, Model model) {
    model.addAttribute("notifications", notificationService.listerUtilisateur(utilisateurId));
    return "notifications/list";
  }
}

