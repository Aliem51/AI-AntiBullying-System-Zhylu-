package com.zhylu.zhylu1.controller;

import com.zhylu.zhylu1.entity.Complaint;
import com.zhylu.zhylu1.repository.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173") 
public class ComplaintController {

    @Autowired
    private ComplaintRepository repository;

    @Value("${file.upload-dir}")
    private String uploadDir = "uploads";

    @GetMapping("/complaints")
    public List<Complaint> getAll() {
        return repository.findAll();
    }

    // НОВЫЙ МЕТОД: Получение одной жалобы по ID (решает проблему StatusChecker)
    @GetMapping("/complaints/{id}")
    public ResponseEntity<?> getById(@PathVariable UUID id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).build());
    }

    @PostMapping(value = "/complaints", consumes = {"multipart/form-data"})
    public ResponseEntity<?> create(
            @RequestParam("description") String description,
            @RequestParam("type") String type,
            @RequestParam(value = "locationRu", required = false) String locationRu,
            @RequestParam(value = "personReporting", required = false) String personReporting,
            @RequestParam(value = "time", required = false) String time,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "studentNames", required = false) String studentNames,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam("priority") Integer priority,
            @RequestParam(value = "attachment", required = false) MultipartFile file
    ) throws IOException {

        Complaint complaint = new Complaint();
        complaint.setDescription(description);
        complaint.setType(type);
        complaint.setLocationRu(locationRu);
        complaint.setPersonReporting(personReporting);
        complaint.setIncidentTime(time);
        complaint.setPhone(phone);
        complaint.setEmail(email);
        complaint.setStudentNames(studentNames);
        complaint.setCategory(category);
        complaint.setAiPriorityScore(priority);
        complaint.setUrgent(priority >= 80);

        if (file != null && !file.isEmpty()) {
        try {
            Path root = Paths.get(uploadDir);
            if (!Files.exists(root)) Files.createDirectories(root);
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), root.resolve(fileName));
            complaint.setFilePath("/uploads/" + fileName);
        } catch (IOException e) {
            // Если файл не сохранился, логируем ошибку, но не останавливаем сохранение жалобы
            System.err.println("Ошибка сохранения файла: " + e.getMessage());
            // Можно либо прервать выполнение, либо продолжить без файла
        }
    }

    Complaint saved = repository.save(complaint);
    return ResponseEntity.ok(Map.of("id", saved.getId()));
}

    @DeleteMapping("/complaints/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.notFound().build();
    }

    @PatchMapping("/complaints/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id, @RequestBody Map<String, Object> updates) {
        return repository.findById(id).map(complaint -> {
            if (updates.containsKey("status")) complaint.setStatus((String) updates.get("status"));
            if (updates.containsKey("adminReply")) complaint.setAdminReply((String) updates.get("adminReply"));
            if (updates.containsKey("assignedTo")) complaint.setAssignedTo((String) updates.get("assignedTo"));
            repository.save(complaint);
            return ResponseEntity.ok(Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("success", true, "user", Map.of("email", body.get("email"), "role", "admin")));
    }
}