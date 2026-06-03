package com.gamebox.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gamebox.dto.GameRateDTO;
import com.gamebox.vo.GameVO;

public interface GameService {
    Page<GameVO> getList(String platform, int page, int size);
    GameVO getById(Long id);
    Page<GameVO> getRecommend(int page, int size);
    void rate(Long userId, GameRateDTO dto);
    Page<?> getRatings(Long gameId, int page, int size);
    Page<GameVO> search(String keyword, int page, int size);
}
