package com.gamebox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReplyDTO {
    @NotNull(message = "帖子ID不能为空")
    private Long postId;

    @NotBlank(message = "回复内容不能为空")
    private String content;

    private Long parentId;
    private Long replyToUserId;
}
