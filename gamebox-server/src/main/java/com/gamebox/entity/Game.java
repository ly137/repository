package com.gamebox.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.gamebox.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_game")
public class Game extends BaseEntity {
    private String name;
    private String cover;
    private String description;
    private String developer;
    private String publisher;
    private LocalDate releaseDate;
    private String platform;
    private String tags;
    private Double rating;
    private Integer ratingCount;
    private Integer isRecommend;
    private Integer status;
}
