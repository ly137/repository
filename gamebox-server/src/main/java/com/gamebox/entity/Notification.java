package com.gamebox.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.gamebox.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_notification")
public class Notification extends BaseEntity {
    private Long userId;
    private Long senderId;
    private Integer type;
    private String content;
    private Integer targetType;
    private Long targetId;
    private Integer isRead;
}
