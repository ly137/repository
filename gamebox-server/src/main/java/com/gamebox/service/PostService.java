package com.gamebox.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gamebox.dto.PostDTO;
import com.gamebox.vo.PostVO;

public interface PostService {
    Long create(Long userId, PostDTO dto);
    PostVO getById(Long id, Long currentUserId);
    void update(Long userId, Long postId, PostDTO dto);
    void delete(Long userId, Long postId);
    Page<PostVO> getFollowingFeed(Long userId, int page, int size);
    Page<PostVO> getRecommendFeed(int page, int size);
    Page<PostVO> getList(String category, String sort, int page, int size);
    Page<PostVO> getListByGame(Long gameId, int page, int size);
    Page<PostVO> search(String keyword, int page, int size);
    Page<PostVO> getUserPosts(Long userId, int page, int size);
}
