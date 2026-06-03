package com.gamebox.controller;

import com.gamebox.common.Result;
import com.gamebox.dto.PostDTO;
import com.gamebox.exception.BusinessException;
import com.gamebox.service.PostService;
import com.gamebox.vo.PostVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/post")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    private Long getUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) throw new BusinessException(401, "请先登录");
        return userId;
    }

    @PostMapping
    public Result<Map<String, Long>> create(@Valid @RequestBody PostDTO dto, HttpServletRequest request) {
        Long id = postService.create(getUserId(request), dto);
        return Result.ok(Map.of("id", id));
    }

    @GetMapping("/{id}")
    public Result<PostVO> getById(@PathVariable Long id, HttpServletRequest request) {
        Long currentUserId = (Long) request.getAttribute("userId");
        return Result.ok(postService.getById(id, currentUserId));
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody PostDTO dto, HttpServletRequest request) {
        postService.update(getUserId(request), id, dto);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        postService.delete(getUserId(request), id);
        return Result.ok();
    }

    @GetMapping("/feed/following")
    public Result<?> getFollowingFeed(HttpServletRequest request,
                                       @RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "10") int size) {
        return Result.ok(postService.getFollowingFeed(getUserId(request), page, size));
    }

    @GetMapping("/feed/recommend")
    public Result<?> getRecommendFeed(@RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "10") int size) {
        return Result.ok(postService.getRecommendFeed(page, size));
    }

    @GetMapping("/list")
    public Result<?> getList(@RequestParam(defaultValue = "1") int page,
                              @RequestParam(defaultValue = "10") int size,
                              @RequestParam(defaultValue = "latest") String sort,
                              @RequestParam(required = false) String category,
                              @RequestParam(required = false) Long gameId) {
        if (gameId != null) {
            return Result.ok(postService.getListByGame(gameId, page, size));
        }
        return Result.ok(postService.getList(category, sort, page, size));
    }

    @GetMapping("/search")
    public Result<?> search(@RequestParam String keyword,
                             @RequestParam(defaultValue = "1") int page,
                             @RequestParam(defaultValue = "20") int size) {
        return Result.ok(postService.search(keyword, page, size));
    }

    @GetMapping("/user/{userId}")
    public Result<?> getUserPosts(@PathVariable Long userId,
                                   @RequestParam(defaultValue = "1") int page,
                                   @RequestParam(defaultValue = "10") int size) {
        return Result.ok(postService.getUserPosts(userId, page, size));
    }
}
