package com.zhylu.zhylu1.repository;

import com.zhylu.zhylu1.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {
}