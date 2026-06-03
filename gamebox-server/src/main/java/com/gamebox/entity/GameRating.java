package com.gamebox.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.gamebox.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_game_rating")
public class GameRating extends BaseEntity {
    private Long userId;
    private Long gameId;
    private Double score;
    private String review;
}
