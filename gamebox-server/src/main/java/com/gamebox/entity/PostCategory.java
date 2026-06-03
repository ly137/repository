package com.gamebox.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.gamebox.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("t_post_category")
public class PostCategory extends BaseEntity {
    private String name;
    private String code;
    private Integer sortOrder;
    private Integer status;
}
