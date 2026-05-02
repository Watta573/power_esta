package com.biblioteca.repository;

import com.biblioteca.entity.CodeBarres;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CodeBarresRepository extends JpaRepository<CodeBarres, Long> {
    
    Optional<CodeBarres> findByCodeAndActifTrue(String code);
    
    List<CodeBarres> findByObjetTypeAndObjetIdAndActifTrue(String objetType, Long objetId);
    
    boolean existsByCodeAndActifTrue(String code);
    
    @Query("SELECT c FROM CodeBarres c WHERE c.objetType = :type AND c.actif = true ORDER BY c.dateCreation DESC")
    List<CodeBarres> findByObjetTypeAndActifTrueOrderByDateCreationDesc(@Param("type") String objetType);
}