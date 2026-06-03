package com.gamebox.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gamebox.dto.LikeDTO;
import com.gamebox.dto.ReplyDTO;
import com.gamebox.vo.PostVO;
import com.gamebox.vo.ReplyVO;

public interface InteractService {
    void like(Long userId, LikeDTO dto);
    void unlike(Long userId, LikeDTO dto);
    ReplyVO reply(Long userId, ReplyDTO dto);
    void deleteReply(Long userId, Long replyId);
    Page<ReplyVO> getReplies(Long postId, int page, int size);
    void favorite(Long userId, Long postId);
    void unfavorite(Long userId, Long postId);
    Page<PostVO> getFavorites(Long userId, int page, int size);
}
