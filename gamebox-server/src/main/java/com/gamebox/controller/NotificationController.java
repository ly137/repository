package com.gamebox.controller;

import com.gamebox.common.Result;
import com.gamebox.exception.BusinessException;
import com.gamebox.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    private Long getUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) throw new BusinessException(401, "请先登录");
        return userId;
    }

    @GetMapping("/list")
    public Result<?> getList(HttpServletRequest request,
                              @RequestParam(defaultValue = "1") int page,
                              @RequestParam(defaultValue = "50") int size) {
        return Result.ok(notificationService.getList(getUserId(request), page, size));
    }

    @GetMapping("/unread-count")
    public Result<Map<String, Long>> getUnreadCount(HttpServletRequest request) {
        return Result.ok(Map.of("count", notificationService.getUnreadCount(getUserId(request))));
    }

    @PutMapping("/read/{id}")
    public Result<Void> markRead(@PathVariable Long id, HttpServletRequest request) {
        notificationService.markRead(getUserId(request), id);
        return Result.ok();
    }

    @PutMapping("/read-all")
    public Result<Void> markAllRead(HttpServletRequest request) {
        notificationService.markAllRead(getUserId(request));
        return Result.ok();
    }
}
