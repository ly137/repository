package com.gamebox.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gamebox.dto.LikeDTO;
import com.gamebox.dto.ReplyDTO;
import com.gamebox.entity.*;
import com.gamebox.exception.BusinessException;
import com.gamebox.mapper.*;
import com.gamebox.service.InteractService;
import com.gamebox.service.NotificationService;
import com.gamebox.vo.PostVO;
import com.gamebox.vo.ReplyVO;
import com.gamebox.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class InteractServiceImpl implements InteractService {

    private final LikeMapper likeMapper;
    private final ReplyMapper replyMapper;
    private final PostMapper postMapper;
    private final FavoriteMapper favoriteMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public void like(Long userId, LikeDTO dto) {
        Like existing = likeMapper.selectOne(new LambdaQueryWrapper<Like>()
                .eq(Like::getUserId, userId)
                .eq(Like::getTargetType, dto.getTargetType())
                .eq(Like::getTargetId, dto.getTargetId()));

        if (existing != null) {
            throw new BusinessException("已点赞");
        }

        Like like = new Like();
        like.setUserId(userId);
        like.setTargetType(dto.getTargetType());
        like.setTargetId(dto.getTargetId());
        likeMapper.insert(like);

        // 更新计数 + 发送通知
        if (dto.getTargetType() == 1) { // 帖子
            Post post = postMapper.selectById(dto.getTargetId());
            if (post != null) {
                post.setLikeCount(post.getLikeCount() + 1);
                postMapper.updateById(post);
                if (!post.getUserId().equals(userId)) {
                    User liker = userMapper.selectById(userId);
                    notificationService.createNotification(post.getUserId(), userId, 1,
                            (liker != null ? liker.getNickname() : "用户") + " 赞了你的帖子", 1, post.getId());
                }
            }
        } else { // 回复
            Reply reply = replyMapper.selectById(dto.getTargetId());
            if (reply != null) {
                reply.setLikeCount(reply.getLikeCount() + 1);
                replyMapper.updateById(reply);
            }
        }
    }

    @Override
    @Transactional
    public void unlike(Long userId, LikeDTO dto) {
        likeMapper.delete(new LambdaQueryWrapper<Like>()
                .eq(Like::getUserId, userId)
                .eq(Like::getTargetType, dto.getTargetType())
                .eq(Like::getTargetId, dto.getTargetId()));

        if (dto.getTargetType() == 1) {
            Post post = postMapper.selectById(dto.getTargetId());
            if (post != null) {
                post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
                postMapper.updateById(post);
            }
        } else {
            Reply reply = replyMapper.selectById(dto.getTargetId());
            if (reply != null) {
                reply.setLikeCount(Math.max(0, reply.getLikeCount() - 1));
                replyMapper.updateById(reply);
            }
        }
    }

    @Override
    @Transactional
    public ReplyVO reply(Long userId, ReplyDTO dto) {
        Post post = postMapper.selectById(dto.getPostId());
        if (post == null || post.getStatus() == 0) {
            throw new BusinessException("帖子不存在");
        }

        Reply reply = new Reply();
        reply.setPostId(dto.getPostId());
        reply.setUserId(userId);
        reply.setContent(dto.getContent());
        reply.setParentId(dto.getParentId());
        reply.setReplyToUserId(dto.getReplyToUserId());
        reply.setLikeCount(0);
        reply.setStatus(1);
        replyMapper.insert(reply);

        // 更新帖子回复数
        post.setReplyCount(post.getReplyCount() + 1);
        postMapper.updateById(post);

        // 发送通知给帖子作者
        if (!post.getUserId().equals(userId)) {
            User replier = userMapper.selectById(userId);
            notificationService.createNotification(post.getUserId(), userId, 2,
                    (replier != null ? replier.getNickname() : "用户") + "回复了你的帖子", 1, post.getId());
        }

        return toReplyVO(reply);
    }

    @Override
    @Transactional
    public void deleteReply(Long userId, Long replyId) {
        Reply reply = replyMapper.selectById(replyId);
        if (reply == null) throw new BusinessException("回复不存在");
        if (!reply.getUserId().equals(userId)) throw new BusinessException(403, "只能删除自己的回复");

        reply.setStatus(0);
        replyMapper.updateById(reply);

        Post post = postMapper.selectById(reply.getPostId());
        if (post != null) {
            post.setReplyCount(Math.max(0, post.getReplyCount() - 1));
            postMapper.updateById(post);
        }
    }

    @Override
    public Page<ReplyVO> getReplies(Long postId, int page, int size) {
        Page<Reply> replyPage = replyMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Reply>()
                        .eq(Reply::getPostId, postId)
                        .eq(Reply::getStatus, 1)
                        .orderByAsc(Reply::getCreatedAt));

        Page<ReplyVO> voPage = new Page<>(page, size, replyPage.getTotal());
        voPage.setRecords(replyPage.getRecords().stream().map(this::toReplyVO).toList());
        return voPage;
    }

    @Override
    @Transactional
    public void favorite(Long userId, Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null || post.getStatus() == 0) throw new BusinessException("帖子不存在");

        Long exists = favoriteMapper.selectCount(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .eq(Favorite::getPostId, postId));
        if (exists > 0) throw new BusinessException("已收藏");

        Favorite fav = new Favorite();
        fav.setUserId(userId);
        fav.setPostId(postId);
        favoriteMapper.insert(fav);
    }

    @Override
    @Transactional
    public void unfavorite(Long userId, Long postId) {
        favoriteMapper.delete(new LambdaQueryWrapper<Favorite>()
                .eq(Favorite::getUserId, userId)
                .eq(Favorite::getPostId, postId));
    }

    @Override
    public Page<PostVO> getFavorites(Long userId, int page, int size) {
        Page<Favorite> favPage = favoriteMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getUserId, userId)
                        .orderByDesc(Favorite::getCreatedAt));

        Page<PostVO> voPage = new Page<>(page, size, favPage.getTotal());
        voPage.setRecords(favPage.getRecords().stream().map(f -> {
            Post post = postMapper.selectById(f.getPostId());
            if (post == null || post.getStatus() == 0) return null;
            PostVO vo = new PostVO();
            vo.setId(post.getId());
            vo.setUserId(post.getUserId());
            vo.setGameId(post.getGameId());
            vo.setTitle(post.getTitle());
            vo.setContent(post.getContent());
            vo.setTags(post.getTags());
            vo.setCoverImage(post.getCoverImage());
            vo.setViewCount(post.getViewCount());
            vo.setLikeCount(post.getLikeCount());
            vo.setReplyCount(post.getReplyCount());
            vo.setShareCount(post.getShareCount());
            vo.setCreatedAt(post.getCreatedAt());

            User author = userMapper.selectById(post.getUserId());
            if (author != null) {
                UserVO avo = new UserVO();
                avo.setId(author.getId());
                avo.setUsername(author.getUsername());
                avo.setNickname(author.getNickname());
                avo.setAvatar(author.getAvatar());
                vo.setAuthor(avo);
            }
            vo.setLiked(false);
            return vo;
        }).filter(Objects::nonNull).toList());
        return voPage;
    }

    private ReplyVO toReplyVO(Reply reply) {
        ReplyVO vo = new ReplyVO();
        vo.setId(reply.getId());
        vo.setPostId(reply.getPostId());
        vo.setParentId(reply.getParentId());
        vo.setContent(reply.getContent());
        vo.setLikeCount(reply.getLikeCount());
        vo.setCreatedAt(reply.getCreatedAt());

        User user = userMapper.selectById(reply.getUserId());
        if (user != null) {
            UserVO uvo = new UserVO();
            uvo.setId(user.getId());
            uvo.setUsername(user.getUsername());
            uvo.setNickname(user.getNickname());
            uvo.setAvatar(user.getAvatar());
            vo.setUser(uvo);
        }

        return vo;
    }
}
