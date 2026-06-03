package com.gamebox.controller;

import com.gamebox.common.Result;
import com.gamebox.dto.ChangePasswordDTO;
import com.gamebox.dto.LoginDTO;
import com.gamebox.dto.RegisterDTO;
import com.gamebox.dto.UpdateProfileDTO;
import com.gamebox.exception.BusinessException;
import com.gamebox.service.UserService;
import com.gamebox.vo.LoginVO;
import com.gamebox.vo.UserVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    private Long getUserId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) throw new BusinessException(401, "请先登录");
        return userId;
    }

    @PostMapping("/register")
    public Result<LoginVO> register(@Valid @RequestBody RegisterDTO dto) {
        return Result.ok(userService.register(dto));
    }

    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginDTO dto) {
        return Result.ok(userService.login(dto));
    }

    @GetMapping("/info")
    public Result<UserVO> getInfo(HttpServletRequest request) {
        return Result.ok(userService.getInfo(getUserId(request)));
    }

    @GetMapping("/{id}")
    public Result<UserVO> getUserById(@PathVariable Long id, HttpServletRequest request) {
        Long currentUserId = (Long) request.getAttribute("userId");
        return Result.ok(userService.getUserById(currentUserId, id));
    }

    @PutMapping("/profile")
    public Result<UserVO> updateProfile(@RequestBody UpdateProfileDTO dto, HttpServletRequest request) {
        return Result.ok(userService.updateProfile(getUserId(request), dto));
    }

    @PutMapping("/password")
    public Result<Void> changePassword(@Valid @RequestBody ChangePasswordDTO dto, HttpServletRequest request) {
        userService.changePassword(getUserId(request), dto);
        return Result.ok();
    }

    @PostMapping("/follow/{id}")
    public Result<Void> follow(@PathVariable Long id, HttpServletRequest request) {
        userService.follow(getUserId(request), id);
        return Result.ok();
    }

    @DeleteMapping("/follow/{id}")
    public Result<Void> unfollow(@PathVariable Long id, HttpServletRequest request) {
        userService.unfollow(getUserId(request), id);
        return Result.ok();
    }

    @GetMapping("/{id}/followers")
    public Result<?> getFollowers(@PathVariable Long id,
                                   @RequestParam(defaultValue = "1") int page,
                                   @RequestParam(defaultValue = "10") int size) {
        return Result.ok(userService.getFollowers(id, page, size));
    }

    @GetMapping("/{id}/followees")
    public Result<?> getFollowees(@PathVariable Long id,
                                   @RequestParam(defaultValue = "1") int page,
                                   @RequestParam(defaultValue = "10") int size) {
        return Result.ok(userService.getFollowees(id, page, size));
    }
}
