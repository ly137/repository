package com.gamebox.controller;

import com.gamebox.common.Result;
import com.gamebox.dto.GameRateDTO;
import com.gamebox.exception.BusinessException;
import com.gamebox.service.GameService;
import com.gamebox.vo.GameVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    private Long getUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) throw new BusinessException(401, "请先登录");
        return userId;
    }

    @GetMapping("/list")
    public Result<?> getList(@RequestParam(defaultValue = "1") int page,
                              @RequestParam(defaultValue = "12") int size,
                              @RequestParam(required = false) String platform) {
        return Result.ok(gameService.getList(platform, page, size));
    }

    @GetMapping("/{id}")
    public Result<GameVO> getById(@PathVariable Long id) {
        return Result.ok(gameService.getById(id));
    }

    @GetMapping("/recommend")
    public Result<?> getRecommend() {
        return Result.ok(gameService.getRecommend(1, 6));
    }

    @PostMapping("/rate")
    public Result<Void> rate(@Valid @RequestBody GameRateDTO dto, HttpServletRequest request) {
        gameService.rate(getUserId(request), dto);
        return Result.ok();
    }

    @GetMapping("/{gameId}/ratings")
    public Result<?> getRatings(@PathVariable Long gameId,
                                 @RequestParam(defaultValue = "1") int page,
                                 @RequestParam(defaultValue = "10") int size) {
        return Result.ok(gameService.getRatings(gameId, page, size));
    }

    @GetMapping("/search")
    public Result<?> search(@RequestParam String keyword,
                             @RequestParam(defaultValue = "1") int page,
                             @RequestParam(defaultValue = "20") int size) {
        return Result.ok(gameService.search(keyword, page, size));
    }
}
