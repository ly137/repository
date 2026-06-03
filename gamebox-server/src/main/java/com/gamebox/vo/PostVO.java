package com.gamebox.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PostVO {
    private Long id;
    private Long userId;
    private Long gameId;
    private String title;
    private String content;
    private String category;
    private String tags;
    private String coverImage;
    private Integer viewCount;
    private Integer likeCount;
    private Integer replyCount;
    private Integer shareCount;
    private Boolean liked;
    private LocalDateTime createdAt;
    private UserVO author;
}
