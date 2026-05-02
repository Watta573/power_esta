package com.biblioteca.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "codes_barres")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeBarres {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "objet_id", nullable = false)
    private Long objetId;
    
    @Column(name = "objet_type", nullable = false, length = 50)
    private String objetType; // LIVRE, UTILISATEUR, EXEMPLAIRE
    
    @Column(nullable = false, unique = true, length = 100)
    private String code;
    
    @Column(name = "type_code", length = 20)
    private String typeCode = "CODE128"; // CODE128, EAN13, QR
    
    @Column(name = "date_creation")
    private LocalDateTime dateCreation = LocalDateTime.now();
    
    @Builder.Default
    private Boolean actif = true;
}