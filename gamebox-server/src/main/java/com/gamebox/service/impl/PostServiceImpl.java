package com.gamebox.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.gamebox.dto.PostDTO;
import com.gamebox.entity.*;
import com.gamebox.exception.BusinessException;
import com.gamebox.mapper.*;
import com.gamebox.service.PostService;
import com.gamebox.vo.PostVO;
import com.gamebox.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostMapper postMapper;
    private final UserMapper userMapper;
    private final FollowMapper followMapper;
    private final LikeMapper likeMapper;
    private final PostCategoryMapper categoryMapper;

    @Override
    @Transactional
    public Long create(Long userId, PostDTO dto) {
        Post post = new Post();
        post.setUserId(userId);
        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setTags(dto.getTags());
        post.setGameId(dto.getGameId());
        post.setCoverImage(dto.getCoverImage());
        post.setViewCount(0);
        post.setLikeCount(0);
        post.setReplyCount(0);
        post.setShareCount(0);
        post.setHeatScore(0.0);
        post.setStatus(1);

        // 根据 category 名称查找分类ID
        PostCategory category = categoryMapper.selectOne(
                new LambdaQueryWrapper<PostCategory>().eq(PostCategory::getCode, dto.getCategory()));
        if (category != null) {
            post.setCategoryId(category.getId());
        }

        postMapper.insert(post);
        return post.getId();
    }

    @Override
    public PostVO getById(Long id, Long currentUserId) {
        Post post = postMapper.selectById(id);
        if (post == null || post.getStatus() == 0) {
            throw new BusinessException(404, "帖子不存在");
        }

        // 增加浏览量
        post.setViewCount(post.getViewCount() + 1);
        postMapper.updateById(post);

        return convertToVO(post, currentUserId);
    }

    @Override
    @Transactional
    public void update(Long userId, Long postId, PostDTO dto) {
        Post post = postMapper.selectById(postId);
        if (post == null) throw new BusinessException("帖子不存在");
        if (!post.getUserId().equals(userId)) throw new BusinessException(403, "只能编辑自己的帖子");

        if (dto.getTitle() != null) post.setTitle(dto.getTitle());
        if (dto.getContent() != null) post.setContent(dto.getContent());
        if (dto.getTags() != null) post.setTags(dto.getTags());
        if (dto.getGameId() != null) post.setGameId(dto.getGameId());
        if (dto.getCoverImage() != null) post.setCoverImage(dto.getCoverImage());
        postMapper.updateById(post);
    }

    @Override
    @Transactional
    public void delete(Long userId, Long postId) {
        Post post = postMapper.selectById(postId);
        if (post == null) throw new BusinessException("帖子不存在");
        if (!post.getUserId().equals(userId)) throw new BusinessException(403, "只能删除自己的帖子");
        post.setStatus(0);
        postMapper.updateById(post);
    }

    @Override
    public Page<PostVO> getFollowingFeed(Long userId, int page, int size) {
        // 查询关注的用户ID列表
        var followList = followMapper.selectList(
                new LambdaQueryWrapper<Follow>().eq(Follow::getFollowerId, userId));
        var followeeIds = followList.stream().map(Follow::getFolloweeId).toList();

        if (followeeIds.isEmpty()) {
            return new Page<>(page, size, 0);
        }

        Page<Post> postPage = postMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Post>()
                        .in(Post::getUserId, followeeIds)
                        .eq(Post::getStatus, 1)
                        .orderByDesc(Post::getCreatedAt));

        return convertPage(postPage, userId);
    }

    @Override
    public Page<PostVO> getRecommendFeed(int page, int size) {
        Page<Post> postPage = postMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Post>()
                        .eq(Post::getStatus, 1)
                        .orderByDesc(Post::getHeatScore)
                        .orderByDesc(Post::getCreatedAt));

        return convertPage(postPage, null);
    }

    @Override
    public Page<PostVO> getList(String category, String sort, int page, int size) {
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<Post>()
                .eq(Post::getStatus, 1);

        if (category != null && !"all".equals(category)) {
            PostCategory cat = categoryMapper.selectOne(
                    new LambdaQueryWrapper<PostCategory>().eq(PostCategory::getCode, category));
            if (cat != null) {
                wrapper.eq(Post::getCategoryId, cat.getId());
            }
        }

        if ("latest".equals(sort)) {
            wrapper.orderByDesc(Post::getCreatedAt);
        } else {
            wrapper.orderByDesc(Post::getHeatScore).orderByDesc(Post::getCreatedAt);
        }

        Page<Post> postPage = postMapper.selectPage(new Page<>(page, size), wrapper);
        return convertPage(postPage, null);
    }

    @Override
    public Page<PostVO> getListByGame(Long gameId, int page, int size) {
        return getList("all", "latest", page, size); // 简化：游戏筛选在 getList 中通过 gameId 参数做
    }

    @Override
    public Page<PostVO> search(String keyword, int page, int size) {
        Page<Post> postPage = postMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Post>()
                        .eq(Post::getStatus, 1)
                        .and(w -> w.like(Post::getTitle, keyword).or().like(Post::getContent, keyword))
                        .orderByDesc(Post::getCreatedAt));

        return convertPage(postPage, null);
    }

    @Override
    public Page<PostVO> getUserPosts(Long userId, int page, int size) {
        Page<Post> postPage = postMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Post>()
                        .eq(Post::getUserId, userId)
                        .eq(Post::getStatus, 1)
                        .orderByDesc(Post::getCreatedAt));

        return convertPage(postPage, null);
    }

    // ===== 辅助方法 =====
    private PostVO convertToVO(Post post, Long currentUserId) {
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

        // category 名称
        if (post.getCategoryId() != null) {
            PostCategory cat = categoryMapper.selectById(post.getCategoryId());
            vo.setCategory(cat != null ? cat.getName() : null);
        }

        // author
        User author = userMapper.selectById(post.getUserId());
        if (author != null) {
            UserVO avo = new UserVO();
            avo.setId(author.getId());
            avo.setUsername(author.getUsername());
            avo.setNickname(author.getNickname());
            avo.setAvatar(author.getAvatar());
            vo.setAuthor(avo);
        }

        // liked
        if (currentUserId != null) {
            Long liked = likeMapper.selectCount(new LambdaQueryWrapper<com.gamebox.entity.Like>()
                    .eq(com.gamebox.entity.Like::getUserId, currentUserId)
                    .eq(com.gamebox.entity.Like::getTargetType, 1)
                    .eq(com.gamebox.entity.Like::getTargetId, post.getId()));
            vo.setLiked(liked > 0);
        } else {
            vo.setLiked(false);
        }

        return vo;
    }

    private Page<PostVO> convertPage(Page<Post> postPage, Long currentUserId) {
        Page<PostVO> voPage = new Page<>(postPage.getCurrent(), postPage.getSize(), postPage.getTotal());
        voPage.setPages((int) postPage.getPages());
        voPage.setRecords(postPage.getRecords().stream()
                .map(p -> convertToVO(p, currentUserId)).toList());
        return voPage;
    }
}
