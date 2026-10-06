package com.zhylu.zhylu1.repository;

import com.zhylu.zhylu1.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID; // Импортируем UUID

// Здесь второй параметр тоже меняем на UUID
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
}