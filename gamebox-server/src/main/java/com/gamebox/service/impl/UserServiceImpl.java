package com.gamebox.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gamebox.config.JwtUtils;
import com.gamebox.dto.ChangePasswordDTO;
import com.gamebox.dto.LoginDTO;
import com.gamebox.dto.RegisterDTO;
import com.gamebox.dto.UpdateProfileDTO;
import com.gamebox.entity.Follow;
import com.gamebox.entity.Post;
import com.gamebox.entity.User;
import com.gamebox.exception.BusinessException;
import com.gamebox.mapper.FollowMapper;
import com.gamebox.mapper.PostMapper;
import com.gamebox.mapper.UserMapper;
import com.gamebox.service.NotificationService;
import com.gamebox.service.UserService;
import com.gamebox.vo.LoginVO;
import com.gamebox.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final FollowMapper followMapper;
    private final PostMapper postMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public LoginVO register(RegisterDTO dto) {
        // 检查用户名唯一性
        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername()));
        if (count > 0) {
            throw new BusinessException("用户名已被注册");
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setNickname(dto.getNickname() != null ? dto.getNickname() : dto.getUsername());
        user.setStatus(1);
        userMapper.insert(user);

        String token = jwtUtils.generateToken(user.getId(), user.getUsername());
        return buildLoginVO(user, token);
    }

    @Override
    public LoginVO login(LoginDTO dto) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername()));
        if (user == null || !passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }
        if (user.getStatus() == 0) {
            throw new BusinessException("账号已被禁用");
        }

        String token = jwtUtils.generateToken(user.getId(), user.getUsername());
        return buildLoginVO(user, token);
    }

    @Override
    public UserVO getInfo(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException("用户不存在");
        return toUserVO(user, false);
    }

    @Override
    public UserVO getUserById(Long currentUserId, Long targetId) {
        User user = userMapper.selectById(targetId);
        if (user == null) throw new BusinessException("用户不存在");
        UserVO vo = toUserVO(user, false);

        // 是否已关注
        if (currentUserId != null) {
            Long count = followMapper.selectCount(new LambdaQueryWrapper<Follow>()
                    .eq(Follow::getFollowerId, currentUserId)
                    .eq(Follow::getFolloweeId, targetId));
            vo.setFollowed(count > 0);
        }

        return vo;
    }

    @Override
    @Transactional
    public UserVO updateProfile(Long userId, UpdateProfileDTO dto) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException("用户不存在");
        if (dto.getNickname() != null) user.setNickname(dto.getNickname());
        if (dto.getBio() != null) user.setBio(dto.getBio());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getAvatar() != null) user.setAvatar(dto.getAvatar());
        userMapper.updateById(user);
        return toUserVO(user, false);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordDTO dto) {
        User user = userMapper.selectById(userId);
        if (user == null) throw new BusinessException("用户不存在");
        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new BusinessException("原密码错误");
        }
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userMapper.updateById(user);
    }

    @Override
    @Transactional
    public void follow(Long followerId, Long followeeId) {
        if (followerId.equals(followeeId)) {
            throw new BusinessException("不能关注自己");
        }
        User followee = userMapper.selectById(followeeId);
        if (followee == null || followee.getStatus() == 0) {
            throw new BusinessException("用户不存在");
        }
        // 检查是否已关注
        Long exists = followMapper.selectCount(new LambdaQueryWrapper<Follow>()
                .eq(Follow::getFollowerId, followerId)
                .eq(Follow::getFolloweeId, followeeId));
        if (exists > 0) {
            throw new BusinessException("已关注该用户");
        }

        Follow follow = new Follow();
        follow.setFollowerId(followerId);
        follow.setFolloweeId(followeeId);
        followMapper.insert(follow);

        // 发送通知
        User follower = userMapper.selectById(followerId);
        notificationService.createNotification(followeeId, followerId, 3,
                "关注了你", null, null);
    }

    @Override
    @Transactional
    public void unfollow(Long followerId, Long followeeId) {
        followMapper.delete(new LambdaQueryWrapper<Follow>()
                .eq(Follow::getFollowerId, followerId)
                .eq(Follow::getFolloweeId, followeeId));
    }

    @Override
    public Page<UserVO> getFollowers(Long userId, int page, int size) {
        Page<Follow> followPage = followMapper.selectPage(
                new Page<>(page, size),
                new LambdaQueryWrapper<Follow>().eq(Follow::getFolloweeId, userId));

        Page<UserVO> voPage = new Page<>(page, size, followPage.getTotal());
        voPage.setRecords(followPage.getRecords().stream().map(f -> {
            User user = userMapper.selectById(f.getFollowerId());
            return user != null ? toSimpleVO(user) : null;
        }).filter(Objects::nonNull).toList());
        return voPage;
    }

    @Override
    public Page<UserVO> getFollowees(Long userId, int page, int size) {
        Page<Follow> followPage = followMapper.selectPage(
                new Page<>(page, size),
                new LambdaQueryWrapper<Follow>().eq(Follow::getFollowerId, userId));

        Page<UserVO> voPage = new Page<>(page, size, followPage.getTotal());
        voPage.setRecords(followPage.getRecords().stream().map(f -> {
            User user = userMapper.selectById(f.getFolloweeId());
            return user != null ? toSimpleVO(user) : null;
        }).filter(Objects::nonNull).toList());
        return voPage;
    }

    // ===== 辅助方法 =====
    private LoginVO buildLoginVO(User user, String token) {
        LoginVO loginVO = new LoginVO();
        loginVO.setToken(token);
        loginVO.setUser(toUserVO(user, false));
        return loginVO;
    }

    private UserVO toUserVO(User user, boolean followed) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setNickname(user.getNickname());
        vo.setAvatar(user.getAvatar());
        vo.setBio(user.getBio());
        vo.setEmail(user.getEmail());
        vo.setFollowed(followed);

        Long postCount = postMapper.selectCount(new LambdaQueryWrapper<Post>()
                .eq(Post::getUserId, user.getId())
                .eq(Post::getStatus, 1));
        Long followeeCount = followMapper.selectCount(new LambdaQueryWrapper<Follow>()
                .eq(Follow::getFollowerId, user.getId()));
        Long followerCount = followMapper.selectCount(new LambdaQueryWrapper<Follow>()
                .eq(Follow::getFolloweeId, user.getId()));

        Integer likeCount = postMapper.selectList(new LambdaQueryWrapper<Post>()
                        .eq(Post::getUserId, user.getId())
                        .eq(Post::getStatus, 1))
                .stream()
                .map(Post::getLikeCount)
                .filter(count -> count != null)
                .reduce(0, Integer::sum);

        vo.setPostCount(postCount.intValue());
        vo.setLikeCount(likeCount);
        vo.setFolloweeCount(followeeCount.intValue());
        vo.setFollowerCount(followerCount.intValue());
        return vo;
    }

    private UserVO toSimpleVO(User user) {
        return toUserVO(user, false);
    }
}
