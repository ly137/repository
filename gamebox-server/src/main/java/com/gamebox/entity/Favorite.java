package com.gamebox.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.gamebox.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_favorite")
public class Favorite extends BaseEntity {
    private Long userId;
    private Long postId;
}
