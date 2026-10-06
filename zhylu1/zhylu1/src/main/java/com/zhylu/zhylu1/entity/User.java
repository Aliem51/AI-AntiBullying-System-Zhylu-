package com.zhylu.zhylu1.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id; // Меняем Long на UUID

    @Column(unique = true)
    private String email;

    private String password;
    private String role;
}