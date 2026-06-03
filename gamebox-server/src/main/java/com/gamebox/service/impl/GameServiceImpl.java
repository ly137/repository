package com.gamebox.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gamebox.dto.GameRateDTO;
import com.gamebox.entity.Game;
import com.gamebox.entity.GameRating;
import com.gamebox.entity.User;
import com.gamebox.exception.BusinessException;
import com.gamebox.mapper.GameMapper;
import com.gamebox.mapper.GameRatingMapper;
import com.gamebox.mapper.UserMapper;
import com.gamebox.service.GameService;
import com.gamebox.vo.GameVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GameServiceImpl implements GameService {

    private final GameMapper gameMapper;
    private final GameRatingMapper gameRatingMapper;
    private final UserMapper userMapper;

    @Override
    public Page<GameVO> getList(String platform, int page, int size) {
        LambdaQueryWrapper<Game> wrapper = new LambdaQueryWrapper<Game>()
                .eq(Game::getStatus, 1);

        if (platform != null && !"all".equals(platform)) {
            wrapper.like(Game::getPlatform, platform);
        }

        wrapper.orderByDesc(Game::getRating);
        Page<Game> gamePage = gameMapper.selectPage(new Page<>(page, size), wrapper);

        Page<GameVO> voPage = new Page<>(page, size, gamePage.getTotal());
        voPage.setPages((int) gamePage.getPages());
        voPage.setRecords(gamePage.getRecords().stream().map(this::toGameVO).toList());
        return voPage;
    }

    @Override
    public GameVO getById(Long id) {
        Game game = gameMapper.selectById(id);
        if (game == null || game.getStatus() == 0) throw new BusinessException(404, "游戏不存在");
        return toGameVO(game);
    }

    @Override
    public Page<GameVO> getRecommend(int page, int size) {
        Page<Game> gamePage = gameMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Game>()
                        .eq(Game::getIsRecommend, 1)
                        .eq(Game::getStatus, 1)
                        .orderByDesc(Game::getRating));

        Page<GameVO> voPage = new Page<>(page, size, gamePage.getTotal());
        voPage.setRecords(gamePage.getRecords().stream().map(this::toGameVO).toList());
        return voPage;
    }

    @Override
    @Transactional
    public void rate(Long userId, GameRateDTO dto) {
        Game game = gameMapper.selectById(dto.getGameId());
        if (game == null) throw new BusinessException("游戏不存在");

        // 检查是否已评分
        GameRating existing = gameRatingMapper.selectOne(new LambdaQueryWrapper<GameRating>()
                .eq(GameRating::getUserId, userId)
                .eq(GameRating::getGameId, dto.getGameId()));

        if (existing != null) {
            // 更新评分
            double oldScore = existing.getScore();
            existing.setScore(dto.getScore());
            if (dto.getReview() != null) existing.setReview(dto.getReview());
            gameRatingMapper.updateById(existing);

            // 更新游戏平均评分
            updateGameRating(dto.getGameId(), null, oldScore, dto.getScore());
        } else {
            GameRating rating = new GameRating();
            rating.setUserId(userId);
            rating.setGameId(dto.getGameId());
            rating.setScore(dto.getScore());
            rating.setReview(dto.getReview());
            gameRatingMapper.insert(rating);

            updateGameRating(dto.getGameId(), 1, null, dto.getScore());
        }
    }

    @Override
    public Page<Map<String, Object>> getRatings(Long gameId, int page, int size) {
        Page<GameRating> ratingPage = gameRatingMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<GameRating>()
                        .eq(GameRating::getGameId, gameId)
                        .orderByDesc(GameRating::getCreatedAt));

        Page<Map<String, Object>> voPage = new Page<>(page, size, ratingPage.getTotal());
        voPage.setRecords(ratingPage.getRecords().stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("score", r.getScore());
            map.put("review", r.getReview());
            map.put("createdAt", r.getCreatedAt());
            User user = userMapper.selectById(r.getUserId());
            if (user != null) {
                Map<String, Object> umap = new HashMap<>();
                umap.put("id", user.getId());
                umap.put("nickname", user.getNickname());
                umap.put("username", user.getUsername());
                umap.put("avatar", user.getAvatar());
                map.put("user", umap);
            }
            return map;
        }).toList());
        return voPage;
    }

    @Override
    public Page<GameVO> search(String keyword, int page, int size) {
        Page<Game> gamePage = gameMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Game>()
                        .like(Game::getName, keyword)
                        .eq(Game::getStatus, 1)
                        .orderByDesc(Game::getRating));

        Page<GameVO> voPage = new Page<>(page, size, gamePage.getTotal());
        voPage.setRecords(gamePage.getRecords().stream().map(this::toGameVO).toList());
        return voPage;
    }

    private void updateGameRating(Long gameId, Integer countDelta, Double oldScore, Double newScore) {
        Game game = gameMapper.selectById(gameId);
        if (game == null) return;

        if (countDelta != null) {
            // 新增评分
            double total = game.getRating() * game.getRatingCount() + newScore;
            game.setRatingCount(game.getRatingCount() + countDelta);
            game.setRating(Math.round(total / game.getRatingCount() * 10.0) / 10.0);
        } else {
            // 修改评分
            double total = game.getRating() * game.getRatingCount() - oldScore + newScore;
            game.setRating(Math.round(total / game.getRatingCount() * 10.0) / 10.0);
        }
        gameMapper.updateById(game);
    }

    private GameVO toGameVO(Game game) {
        GameVO vo = new GameVO();
        vo.setId(game.getId());
        vo.setName(game.getName());
        vo.setCover(game.getCover());
        vo.setDescription(game.getDescription());
        vo.setDeveloper(game.getDeveloper());
        vo.setPublisher(game.getPublisher());
        vo.setReleaseDate(game.getReleaseDate());
        vo.setPlatform(game.getPlatform());
        vo.setTags(game.getTags());
        vo.setRating(game.getRating());
        vo.setRatingCount(game.getRatingCount());
        vo.setIsRecommend(game.getIsRecommend());
        return vo;
    }
}
