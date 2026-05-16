package com.campus.notification.service;

import com.campus.notification.model.Notification;
import com.campus.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    private final NotificationRepository repo;

    public NotificationService(NotificationRepository repo) {
        this.repo = repo;
    }

    public Map<String, Object> getNotifications(int studentId, String type, int page, int limit) {
        logger.info("[NotificationService] Fetching notifications for student={}, type={}, page={}, limit={}",
                studentId, type, page, limit);

        PageRequest pageable = PageRequest.of(page - 1, limit);
        Page<Notification> results;

        if (type != null && !type.isEmpty()) {
            results = repo.findByStudentIdAndTypeOrderByCreatedAtDesc(studentId, type, pageable);
        } else {
            results = repo.findByStudentIdOrderByCreatedAtDesc(studentId, pageable);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("notifications", results.getContent());
        response.put("page", results.getNumber() + 1);
        response.put("totalPages", results.getTotalPages());
        response.put("totalRecords", results.getTotalElements());

        logger.info("[NotificationService] Returned {} notifications, totalPages={}",
                results.getNumberOfElements(), results.getTotalPages());
        return response;
    }

    public long getUnreadCount(int studentId) {
        long count = repo.countUnreadByStudentId(studentId);
        logger.info("[NotificationService] Unread count for student={}: {}", studentId, count);
        return count;
    }

    @Transactional
    public boolean markAsRead(String id, int studentId) {
        int updated = repo.markAsRead(id, studentId);
        logger.info("[NotificationService] markAsRead id={}, student={}, updated={}", id, studentId, updated);
        return updated > 0;
    }

    @Transactional
    public int markAllAsRead(int studentId) {
        int updated = repo.markAllAsRead(studentId);
        logger.info("[NotificationService] markAllAsRead student={}, updated={}", studentId, updated);
        return updated;
    }

    public Notification createNotification(int studentId, String type, String message) {
        Notification notif = new Notification();
        notif.setId(UUID.randomUUID().toString());
        notif.setStudentId(studentId);
        notif.setType(type);
        notif.setMessage(message);
        notif.setIsRead(false);
        notif.setCreatedAt(LocalDateTime.now());

        Notification saved = repo.save(notif);
        logger.info("[NotificationService] Created notification id={} for student={}, type={}",
                saved.getId(), studentId, type);
        return saved;
    }

    public List<Notification> getAllForPriorityInbox(int studentId) {
        List<Notification> all = repo.findByStudentIdOrderByCreatedAtDesc(studentId);
        logger.info("[NotificationService] Fetched {} notifications for priority inbox, student={}",
                all.size(), studentId);
        return all;
    }
}
