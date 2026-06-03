package com.gamebox.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationVO {
    private Long id;
    private Integer type;
    private String content;
    private Boolean isRead;
    private Integer targetType;
    private Long targetId;
    private LocalDateTime createdAt;
    private UserVO sender;
}
