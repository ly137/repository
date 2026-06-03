package com.gamebox.controller;

import com.gamebox.common.Result;
import com.gamebox.dto.LikeDTO;
import com.gamebox.dto.ReplyDTO;
import com.gamebox.exception.BusinessException;
import com.gamebox.service.InteractService;
import com.gamebox.vo.ReplyVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interact")
@RequiredArgsConstructor
public class InteractController {

    private final InteractService interactService;

    private Long getUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) throw new BusinessException(401, "请先登录");
        return userId;
    }

    @PostMapping("/like")
    public Result<Void> like(@Valid @RequestBody LikeDTO dto, HttpServletRequest request) {
        interactService.like(getUserId(request), dto);
        return Result.ok();
    }

    @DeleteMapping("/like")
    public Result<Void> unlike(@Valid @RequestBody LikeDTO dto, HttpServletRequest request) {
        interactService.unlike(getUserId(request), dto);
        return Result.ok();
    }

    @PostMapping("/reply")
    public Result<ReplyVO> reply(@Valid @RequestBody ReplyDTO dto, HttpServletRequest request) {
        return Result.ok(interactService.reply(getUserId(request), dto));
    }

    @DeleteMapping("/reply/{id}")
    public Result<Void> deleteReply(@PathVariable Long id, HttpServletRequest request) {
        interactService.deleteReply(getUserId(request), id);
        return Result.ok();
    }

    @GetMapping("/replies/{postId}")
    public Result<?> getReplies(@PathVariable Long postId,
                                 @RequestParam(defaultValue = "1") int page,
                                 @RequestParam(defaultValue = "20") int size) {
        return Result.ok(interactService.getReplies(postId, page, size));
    }

    @PostMapping("/favorite/{postId}")
    public Result<Void> favorite(@PathVariable Long postId, HttpServletRequest request) {
        interactService.favorite(getUserId(request), postId);
        return Result.ok();
    }

    @DeleteMapping("/favorite/{postId}")
    public Result<Void> unfavorite(@PathVariable Long postId, HttpServletRequest request) {
        interactService.unfavorite(getUserId(request), postId);
        return Result.ok();
    }

    @GetMapping("/favorites")
    public Result<?> getFavorites(HttpServletRequest request,
                                   @RequestParam(defaultValue = "1") int page,
                                   @RequestParam(defaultValue = "10") int size) {
        return Result.ok(interactService.getFavorites(getUserId(request), page, size));
    }
}
