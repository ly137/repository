package com.gamebox.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gamebox.entity.Notification;
import com.gamebox.entity.User;
import com.gamebox.mapper.NotificationMapper;
import com.gamebox.mapper.UserMapper;
import com.gamebox.service.NotificationService;
import com.gamebox.vo.NotificationVO;
import com.gamebox.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationMapper notificationMapper;
    private final UserMapper userMapper;

    @Override
    public Page<NotificationVO> getList(Long userId, int page, int size) {
        Page<Notification> nPage = notificationMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Notification>()
                        .eq(Notification::getUserId, userId)
                        .orderByDesc(Notification::getCreatedAt));

        Page<NotificationVO> voPage = new Page<>(page, size, nPage.getTotal());
        voPage.setRecords(nPage.getRecords().stream().map(this::toVO).toList());
        return voPage;
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationMapper.selectCount(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getIsRead, 0));
    }

    @Override
    @Transactional
    public void markRead(Long userId, Long notificationId) {
        Notification notif = notificationMapper.selectById(notificationId);
        if (notif != null && notif.getUserId().equals(userId)) {
            notif.setIsRead(1);
            notificationMapper.updateById(notif);
        }
    }

    @Override
    @Transactional
    public void markAllRead(Long userId) {
        var list = notificationMapper.selectList(new LambdaQueryWrapper<Notification>()
                .eq(Notification::getUserId, userId)
                .eq(Notification::getIsRead, 0));
        for (Notification n : list) {
            n.setIsRead(1);
            notificationMapper.updateById(n);
        }
    }

    @Override
    @Transactional
    public void createNotification(Long userId, Long senderId, Integer type, String content,
                                    Integer targetType, Long targetId) {
        Notification notif = new Notification();
        notif.setUserId(userId);
        notif.setSenderId(senderId);
        notif.setType(type);
        notif.setContent(content);
        notif.setTargetType(targetType);
        notif.setTargetId(targetId);
        notif.setIsRead(0);
        notificationMapper.insert(notif);
    }

    private NotificationVO toVO(Notification n) {
        NotificationVO vo = new NotificationVO();
        vo.setId(n.getId());
        vo.setType(n.getType());
        vo.setContent(n.getContent());
        vo.setIsRead(n.getIsRead() == 1);
        vo.setTargetType(n.getTargetType());
        vo.setTargetId(n.getTargetId());
        vo.setCreatedAt(n.getCreatedAt());

        if (n.getSenderId() != null) {
            User sender = userMapper.selectById(n.getSenderId());
            if (sender != null) {
                UserVO svo = new UserVO();
                svo.setId(sender.getId());
                svo.setUsername(sender.getUsername());
                svo.setNickname(sender.getNickname());
                svo.setAvatar(sender.getAvatar());
                vo.setSender(svo);
            }
        }
        return vo;
    }
}
