package com.gamebox.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.gamebox.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_post")
public class Post extends BaseEntity {
    private Long userId;
    private Long gameId;
    private Long categoryId;
    private String title;
    private String content;
    private String tags;
    private String coverImage;
    private Integer viewCount;
    private Integer likeCount;
    private Integer replyCount;
    private Integer shareCount;
    private Double heatScore;
    private Integer isTop;
    private Integer isEssence;
    private Integer status;
}
