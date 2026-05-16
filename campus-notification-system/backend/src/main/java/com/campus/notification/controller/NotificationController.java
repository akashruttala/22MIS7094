package com.campus.notification.controller;

import com.campus.notification.model.Notification;
import com.campus.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(
            @RequestParam(defaultValue = "1042") int studentId,
            @RequestParam(required = false) String notification_type,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {

        logger.info("[Controller] GET /notifications - student={}, type={}, page={}, limit={}",
                studentId, notification_type, page, limit);

        Map<String, Object> result = service.getNotifications(studentId, notification_type, page, limit);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @RequestParam(defaultValue = "1042") int studentId) {

        logger.info("[Controller] GET /unread-count - student={}", studentId);
        long count = service.getUnreadCount(studentId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("unreadCount", count);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable String id,
            @RequestParam(defaultValue = "1042") int studentId) {

        logger.info("[Controller] PATCH /notifications/{}/read - student={}", id, studentId);
        boolean success = service.markAsRead(id, studentId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", success);
        response.put("message", success ? "Notification marked as read" : "Notification not found");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @RequestParam(defaultValue = "1042") int studentId) {

        logger.info("[Controller] PATCH /notifications/read-all - student={}", studentId);
        int updated = service.markAllAsRead(studentId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "All notifications marked as read");
        response.put("updatedCount", updated);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createNotification(@RequestBody Map<String, Object> body) {
        String type = (String) body.get("type");
        String message = (String) body.get("message");
        List<Integer> studentIds = (List<Integer>) body.getOrDefault("studentIds", List.of(1042));

        logger.info("[Controller] POST /notifications - type={}, students={}", type, studentIds.size());

        List<Notification> created = new ArrayList<>();
        for (int sid : studentIds) {
            created.add(service.createNotification(sid, type, message));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Notification sent to " + created.size() + " students");
        return ResponseEntity.status(201).body(response);
    }
}
