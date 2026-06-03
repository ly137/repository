package com.gamebox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PostDTO {
    @NotBlank(message = "标题不能为空")
    @Size(max = 100, message = "标题最多100字")
    private String title;

    @NotBlank(message = "内容不能为空")
    private String content;

    @NotBlank(message = "分类不能为空")
    private String category;

    private String tags;
    private Long gameId;
    private String coverImage;
}
