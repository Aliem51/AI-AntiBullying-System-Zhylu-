package com.zhylu.zhylu1.entity;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty; // Важно!
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;


@Entity
@Table(name = "complaints")
@Data
public class Complaint {
    
    @Id
@GeneratedValue(strategy = GenerationType.UUID)
@JdbcTypeCode(SqlTypes.UUID) // Явно указываем тип для базы данных
@Column(name = "id", updatable = false, nullable = false)
private UUID id;

    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String type;
    
    @Column(name = "location_ru")
    @JsonProperty("location_ru") // Маппинг для фронта
    private String locationRu;

    @Column(name = "person_reporting")
    @JsonProperty("person_reporting") // Маппинг для фронта
    private String personReporting;

    @Column(name = "incident_time")
    @JsonProperty("time") // Фронт ждет именно "time"
    private String incidentTime;
    
    private String phone;
    private String email;

    @Column(name = "student_names", columnDefinition = "TEXT")
    @JsonProperty("student_names") // Маппинг для фронта
    private String studentNames;

    private String category;
    
    @Column(name = "ai_priority_score")
    @JsonProperty("ai_priority_score") // Маппинг для фронта
    private Integer aiPriorityScore;

    @Column(name = "is_urgent")
    @JsonProperty("is_urgent")
    private boolean isUrgent;

    private String status = "new";

    @Column(name = "file_path")
    @JsonProperty("file_path") // Маппинг для фронта
    private String filePath;

    @Column(name = "admin_reply", columnDefinition = "TEXT")
    @JsonProperty("admin_reply") // Маппинг для фронта
    private String adminReply;

    @Column(name = "assigned_to")
    @JsonProperty("assigned_to") // Маппинг для фронта
    private String assignedTo;

    @Column(name = "created_at")
    @JsonProperty("created_at") // Маппинг для фронта
    private LocalDateTime createdAt = LocalDateTime.now();
}