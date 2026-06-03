package com.gamebox.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gamebox.dto.ChangePasswordDTO;
import com.gamebox.dto.LoginDTO;
import com.gamebox.dto.RegisterDTO;
import com.gamebox.dto.UpdateProfileDTO;
import com.gamebox.vo.LoginVO;
import com.gamebox.vo.UserVO;

public interface UserService {
    LoginVO register(RegisterDTO dto);
    LoginVO login(LoginDTO dto);
    UserVO getInfo(Long userId);
    UserVO getUserById(Long currentUserId, Long targetId);
    UserVO updateProfile(Long userId, UpdateProfileDTO dto);
    void changePassword(Long userId, ChangePasswordDTO dto);
    void follow(Long followerId, Long followeeId);
    void unfollow(Long followerId, Long followeeId);
    Page<UserVO> getFollowers(Long userId, int page, int size);
    Page<UserVO> getFollowees(Long userId, int page, int size);
}
