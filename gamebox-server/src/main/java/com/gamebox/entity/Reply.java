package com.gamebox.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.gamebox.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_reply")
public class Reply extends BaseEntity {
    private Long postId;
    private Long userId;
    private Long parentId;
    private Long replyToUserId;
    private String content;
    private Integer likeCount;
    private Integer status;
}
