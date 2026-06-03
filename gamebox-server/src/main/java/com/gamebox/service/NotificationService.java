package com.gamebox.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gamebox.vo.NotificationVO;

public interface NotificationService {
    Page<NotificationVO> getList(Long userId, int page, int size);
    long getUnreadCount(Long userId);
    void markRead(Long userId, Long notificationId);
    void markAllRead(Long userId);
    void createNotification(Long userId, Long senderId, Integer type, String content, Integer targetType, Long targetId);
}
