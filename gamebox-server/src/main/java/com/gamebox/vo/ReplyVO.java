package com.gamebox.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReplyVO {
    private Long id;
    private Long postId;
    private Long parentId;
    private String content;
    private Integer likeCount;
    private LocalDateTime createdAt;
    private UserVO user;
}
