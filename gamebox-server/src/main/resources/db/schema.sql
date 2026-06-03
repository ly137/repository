-- ============================================
-- GameBox 游戏社区平台 数据库建表脚本
-- H2 兼容语法（同时兼容 MySQL 8.0）
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS t_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar VARCHAR(255),
    bio VARCHAR(500),
    email VARCHAR(100),
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 帖子表
CREATE TABLE IF NOT EXISTS t_post (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    game_id BIGINT,
    category_id BIGINT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    tags VARCHAR(500),
    cover_image VARCHAR(255),
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    share_count INT DEFAULT 0,
    heat_score DOUBLE DEFAULT 0,
    is_top TINYINT DEFAULT 0,
    is_essence TINYINT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES t_user(id)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 帖子分类字典表
CREATE TABLE IF NOT EXISTS t_post_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    sort_order INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 回复表
CREATE TABLE IF NOT EXISTS t_reply (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    parent_id BIGINT,
    reply_to_user_id BIGINT,
    content TEXT NOT NULL,
    like_count INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES t_post(id),
    FOREIGN KEY (user_id) REFERENCES t_user(id)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 游戏表
CREATE TABLE IF NOT EXISTS t_game (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cover VARCHAR(255),
    description TEXT,
    developer VARCHAR(100),
    publisher VARCHAR(100),
    release_date DATE,
    platform VARCHAR(100),
    tags VARCHAR(500),
    rating DECIMAL(3,2) DEFAULT 0,
    rating_count INT DEFAULT 0,
    is_recommend TINYINT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 用户关注表
CREATE TABLE IF NOT EXISTS t_follow (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    follower_id BIGINT NOT NULL,
    followee_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (follower_id, followee_id),
    FOREIGN KEY (follower_id) REFERENCES t_user(id),
    FOREIGN KEY (followee_id) REFERENCES t_user(id)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 点赞表
CREATE TABLE IF NOT EXISTS t_like (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    target_type TINYINT NOT NULL,
    target_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, target_type, target_id),
    FOREIGN KEY (user_id) REFERENCES t_user(id)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 收藏表
CREATE TABLE IF NOT EXISTS t_favorite (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES t_user(id),
    FOREIGN KEY (post_id) REFERENCES t_post(id)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 游戏评分表
CREATE TABLE IF NOT EXISTS t_game_rating (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    game_id BIGINT NOT NULL,
    score DECIMAL(3,1) NOT NULL,
    review TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, game_id),
    FOREIGN KEY (user_id) REFERENCES t_user(id),
    FOREIGN KEY (game_id) REFERENCES t_game(id)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 通知表
CREATE TABLE IF NOT EXISTS t_notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    sender_id BIGINT,
    type TINYINT NOT NULL,
    content VARCHAR(500),
    target_type TINYINT,
    target_id BIGINT,
    is_read TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES t_user(id)
) DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- 初始化数据：分类 + 示例游戏 + 测试用户
-- ============================================

-- 帖子分类
INSERT INTO t_post_category (name, code, sort_order) VALUES
('攻略', 'guide', 1),
('讨论', 'discuss', 2),
('求助', 'help', 3),
('分享', 'share', 4),
('新闻', 'news', 5);

-- 示例游戏
INSERT INTO t_game (name, cover, description, developer, publisher, release_date, platform, tags, is_recommend, rating, rating_count) VALUES
('艾尔登法环', '', 'FromSoftware 与乔治·R·R·马丁联手打造的黑暗奇幻动作RPG，探索广阔的交界之地。', 'FromSoftware', 'Bandai Namco', '2022-02-25', 'PC,PS5,Xbox', '魂系,开放世界,RPG', 1, 9.5, 1200),
('塞尔达传说：王国之泪', '', '林克的冒险再次展开，天空、大地、地下三层无缝探索，创造力驱动的开放世界。', '任天堂', '任天堂', '2023-05-12', 'Switch', '开放世界,冒险,解谜', 1, 9.8, 980),
('博德之门3', '', '基于D&D规则的史诗级角色扮演游戏，选择与后果塑造你的传奇故事。', 'Larian Studios', 'Larian Studios', '2023-08-03', 'PC,PS5', 'RPG,回合制,奇幻', 1, 9.6, 850),
('黑神话：悟空', '', '以中国神话为背景的动作RPG，踏上西行之路，直面天命。', '游戏科学', '游戏科学', '2024-08-20', 'PC,PS5', '动作,RPG,神话', 1, 9.2, 2100),
('星露谷物语', '', '继承祖父的农场，在像素世界中种田、采矿、交友、恋爱，过上田园生活。', 'ConcernedApe', 'ConcernedApe', '2016-02-27', 'PC,Switch,PS5,Xbox', '模拟经营,像素,休闲', 1, 9.3, 760);

-- 测试用户 (密码: 123456 -> BCrypt)
INSERT INTO t_user (username, password, nickname, bio) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '管理员', 'GameBox 官方管理员'),
('player1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '玩家一号', '热爱游戏的普通玩家'),
('gamer_pro', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '高玩达人', '全平台制霸！'),
('game_girl', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '游戏少女', '只玩好游戏~'),
('rpg_lover', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'RPG爱好者', 'RPG永不毕业！');

-- 示例帖子
INSERT INTO t_post (user_id, game_id, title, content, category_id, tags, view_count, like_count, reply_count, heat_score) VALUES
(2, 1, '艾尔登法环 DLC 黄金树幽影 全地图攻略', '经过100小时的探索，终于整理了这份完整攻略...', 1, '艾尔登法环,攻略,DLC', 2340, 156, 43, 85.6),
(3, 4, '黑神话：悟空 隐藏BOSS全部打法分享', '虎先锋、蝜蝂、赤髯龙...每个隐藏BOSS的详细打法', 1, '黑神话,悟空,BOSS攻略', 1890, 203, 67, 92.3),
(4, 3, '博德之门3 最强Build推荐', '玩了300小时后总结的最强职业组合...', 2, '博德之门3,Build,RPG', 1200, 89, 32, 45.2),
(5, 2, '王国之泪 200小时后的感动', '通关后久久不能平静，记录一些碎碎念...', 4, '塞尔达,王国之泪,感想', 890, 67, 18, 28.7),
(2, 5, '星露谷物语 新手入门指南', '刚入坑的小伙伴看这篇就够了...', 1, '星露谷,新手,指南', 560, 45, 12, 15.3),
(3, 4, '黑神话DLC预测：下一站天庭？', '根据原著推测DLC走向...', 5, '黑神话,悟空,DLC,预测', 3200, 278, 98, 120.5),
(4, 1, '讨论：FromSoftware下一作会是什么题材', '装甲核心新作刚出，但魂系玩家更期待...', 2, 'FromSoftware,魂系,新作', 670, 34, 15, 18.9),
(5, 3, '求助：博德之门3 影心个人任务卡住了', '在第二章某处触发不了剧情...', 3, '博德之门3,求助,Bug', 320, 12, 8, 6.5);

-- 示例回复
INSERT INTO t_reply (post_id, user_id, content, like_count) VALUES
(1, 3, '太有用了！正好卡在幽影城！', 12),
(1, 4, '补充一下：XXBOSS还有第二阶段需要注意', 8),
(2, 5, '虎先锋那里死了一下午终于过了', 15),
(2, 2, '隐藏结局的条件是什么？', 6),
(6, 4, '分析得很到位，期待DLC！', 20),
(6, 2, '我觉得游科可能会先出其他神话线的DLC', 10),
(6, 5, '不管出什么我都买爆！', 8);
