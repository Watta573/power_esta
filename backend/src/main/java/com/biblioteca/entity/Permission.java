package com.biblioteca.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "permissions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code; // Ex: "FINANCES_VIEW", "ACQUISITIONS_MANAGE", etc.

    @Column(nullable = false, length = 200)
    private String nom; // Nom affiché

    @Column(length = 500)
    private String description;

    @Column(nullable = false, length = 50)
    private String module; // "FINANCES", "ACQUISITIONS", "EMPRUNTS", etc.

    @Column(nullable = false)
    private Boolean actif = true;
}