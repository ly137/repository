# GameBox 游戏社区平台 — API 接口设计文档

> 基于前端 SPA 源码逆向推导，所有接口路径、请求参数、响应结构均与前端 `js/api.js` 保持一致。
> Base URL: `http://localhost:8080/api`

---

## 一、数据库表设计

### 1.1 表清单

| 序号 | 表名 | 说明 |
|------|------|------|
| 1 | `t_user` | 用户表 |
| 2 | `t_post` | 帖子表 |
| 3 | `t_reply` | 回复表 |
| 4 | `t_game` | 游戏表 |
| 5 | `t_follow` | 用户关注表 |
| 6 | `t_like` | 点赞表 |
| 7 | `t_favorite` | 收藏表（前端有收藏功能，补充此表） |
| 8 | `t_game_rating` | 游戏评分表 |
| 9 | `t_notification` | 通知表 |
| 10 | `t_post_category` | 帖子分类字典表 |

### 1.2 表关系图

```
t_user ──1:N──> t_post           (user_id)
t_user ──1:N──> t_reply          (user_id)
t_user ──1:N──> t_follow         (follower_id, followee_id)
t_user ──1:N──> t_like           (user_id)
t_user ──1:N──> t_favorite       (user_id)
t_user ──1:N──> t_game_rating    (user_id)
t_user ──1:N──> t_notification   (user_id, sender_id)

t_post ──1:N──> t_reply          (post_id)
t_post ──1:N──> t_like           (target_type=1, target_id)
t_post ──1:N──> t_favorite       (post_id)
t_post ──N:1──> t_game           (game_id)

t_game ──1:N──> t_game_rating    (game_id)
t_game ──1:N──> t_post           (game_id)

t_reply ──1:N──> t_like          (target_type=2, target_id)
t_reply ──1:N──> t_reply         (parent_id, 楼中楼自关联)
```

### 1.3 核心关系速览

```
用户(t_user)
  ├── 发表 帖子(t_post)
  │     ├── 关联 游戏(t_game)
  │     ├── 被 回复(t_reply)
  │     ├── 被 点赞(t_like)
  │     └── 被 收藏(t_favorite)
  ├── 关注 其他用户(t_follow)
  ├── 点赞 帖子/回复(t_like)
  ├── 收藏 帖子(t_favorite)
  ├── 评分 游戏(t_game_rating)
  └── 接收 通知(t_notification)
```

---

## 二、统一规范

### 2.1 请求规范

| 项 | 规范 |
|----|------|
| Base URL | `http://localhost:8080/api` |
| 请求格式 | `application/json` |
| 字符编码 | UTF-8 |
| 鉴权方式 | `Authorization: Bearer {token}` |

### 2.2 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 200=成功，0=也视为成功，401=未登录/Token过期 |
| message | string | 提示信息 |
| data | object/array/null | 响应数据 |

> 前端兼容 `json.code === 200` 和 `json.code === 0` 两种成功码。

### 2.3 分页响应格式

三种格式均被前端兼容，**推荐使用格式 A**：

**格式 A（MyBatis-Plus 原生）**：
```json
{
  "code": 200,
  "data": {
    "records": [...],
    "total": 100,
    "pages": 10
  }
}
```

**格式 B（旧式兼容）**：
```json
{
  "list": [...], "total": 100, "totalPage": 10
}
```

**格式 C（Spring Data）**：
```json
{
  "content": [...], "totalElements": 100, "totalPages": 10
}
```

### 2.4 数据字段命名

后端使用下划线（snake_case）存储，但前端期待驼峰（camelCase）。建议配置 MyBatis-Plus `map-underscore-to-camel-case: true` 自动转换。

---

## 三、接口详细设计

---

### 3.1 用户模块 `/api/user`

#### 3.1.1 用户注册

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/api/user/register` |
| 鉴权 | 无 |

**请求体**：
```json
{
  "username": "string (2-20字符, 必填)",
  "password": "string (6+位, 必填)",
  "nickname": "string (可选, 默认=username)"
}
```

**响应 data**：
```json
{
  "id": 1,
  "username": "player1"
}
```

**涉及表**：`t_user`

---

#### 3.1.2 用户登录

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/api/user/login` |
| 鉴权 | 无 |

**请求体**：
```json
{
  "username": "string (必填)",
  "password": "string (必填)"
}
```

**响应 data**：
```json
{
  "token": "eyJ...",
  "user": {
    "id": 1,
    "username": "player1",
    "nickname": "玩家一号",
    "avatar": "https://...",
    "bio": "...",
    "email": "..."
  }
}
```

> - 密码使用 BCrypt 验证
> - `token` 为 JWT，有效期建议 7 天
> - `user` 对象前端存入 `localStorage` 和全局 `store`

**涉及表**：`t_user`

---

#### 3.1.3 获取当前用户信息

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/user/info` |
| 鉴权 | 需要 |

**响应 data**：
```json
{
  "id": 1,
  "username": "player1",
  "nickname": "玩家一号",
  "avatar": "https://...",
  "bio": "...",
  "email": "..."
}
```

**涉及表**：`t_user`

---

#### 3.1.4 查看用户主页

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/user/{id}` |
| 鉴权 | 可选（未登录也能看） |

**响应 data**：
```json
{
  "id": 2,
  "username": "player2",
  "nickname": "玩家二号",
  "avatar": "https://...",
  "bio": "...",
  "postCount": 15,
  "likeCount": 230,
  "followeeCount": 42,
  "followerCount": 88,
  "followed": false
}
```

> - `followed`：当前登录用户是否已关注此用户（未登录时=false）
> - `likeCount`：该用户所有帖子的获赞总数
> - 统计数据通过 SQL 聚合或从 `t_user` 冗余字段读取

**涉及表**：`t_user`、`t_post`、`t_follow`、`t_like`

---

#### 3.1.5 更新个人资料

| 项 | 内容 |
|----|------|
| 方法 | `PUT` |
| 路径 | `/api/user/profile` |
| 鉴权 | 需要 |

**请求体**：
```json
{
  "nickname": "string (可选)",
  "bio": "string (可选, 最长200)",
  "email": "string (可选)",
  "avatar": "string (可选)"
}
```

**响应 data**（返回更新后的用户对象，同上 3.1.3）

**涉及表**：`t_user`

---

#### 3.1.6 修改密码

| 项 | 内容 |
|----|------|
| 方法 | `PUT` |
| 路径 | `/api/user/password` |
| 鉴权 | 需要 |

**请求体**：
```json
{
  "oldPassword": "string (必填)",
  "newPassword": "string (6+位, 必填)"
}
```

**涉及表**：`t_user`

---

#### 3.1.7 关注用户

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/api/user/follow/{id}` |
| 鉴权 | 需要 |

> - `{id}` 为被关注的用户ID
> - 不可自己关注自己
> - 重复关注返回错误

**涉及表**：`t_follow`、`t_notification`

---

#### 3.1.8 取消关注

| 项 | 内容 |
|----|------|
| 方法 | `DELETE` |
| 路径 | `/api/user/follow/{id}` |
| 鉴权 | 需要 |

**涉及表**：`t_follow`

---

#### 3.1.9 粉丝列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/user/{id}/followers?page=1&size=10` |
| 鉴权 | 可选 |

**响应 data**（分页）：
```json
{
  "records": [
    {
      "id": 3,
      "username": "fan1",
      "nickname": "粉丝一号",
      "avatar": "...",
      "bio": "..."
    }
  ],
  "total": 50,
  "pages": 5
}
```

**涉及表**：`t_follow` JOIN `t_user`

---

#### 3.1.10 关注列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/user/{id}/followees?page=1&size=10` |
| 鉴权 | 可选 |

> 响应格式同粉丝列表（3.1.9）

**涉及表**：`t_follow` JOIN `t_user`

---

### 3.2 帖子模块 `/api/post`

#### 3.2.1 发布帖子

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/api/post` |
| 鉴权 | 需要 |

**请求体**：
```json
{
  "title": "string (必填, 最长100)",
  "content": "string (必填, 支持HTML/Markdown)",
  "category": "string (必填: 攻略|讨论|求助|分享|新闻)",
  "tags": "string (逗号分隔, 可选)",
  "gameId": "number|null (可选, 关联游戏ID)",
  "coverImage": "string (可选, 封面图URL)"
}
```

**响应 data**：
```json
{ "id": 123 }
```

> 前端通过 `result.id || result` 获取帖子ID

**涉及表**：`t_post`

---

#### 3.2.2 帖子详情

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/post/{id}` |
| 鉴权 | 可选（未登录 `liked`=false） |

**响应 data**：
```json
{
  "id": 123,
  "title": "...",
  "content": "...",
  "category": "攻略",
  "tags": "艾尔登法环,攻略",
  "coverImage": "https://...",
  "viewCount": 1024,
  "likeCount": 88,
  "replyCount": 32,
  "shareCount": 5,
  "createdAt": "2026-05-27T10:00:00",
  "liked": false,
  "gameId": 1,
  "author": {
    "id": 1,
    "username": "player1",
    "nickname": "玩家一号",
    "avatar": "https://..."
  }
}
```

> - `liked`：当前登录用户是否已点赞该帖子
> - 每次访问 `viewCount + 1`
> - `tags` 可以是逗号分隔字符串，也可以是数组（建议兼容）

**涉及表**：`t_post` JOIN `t_user` + `t_like`（检查点赞状态）

---

#### 3.2.3 编辑帖子

| 项 | 内容 |
|----|------|
| 方法 | `PUT` |
| 路径 | `/api/post/{id}` |
| 鉴权 | 需要（仅作者本人） |

**请求体**：同发布帖子（3.2.1），所有字段可选传

**涉及表**：`t_post`

---

#### 3.2.4 删除帖子

| 项 | 内容 |
|----|------|
| 方法 | `DELETE` |
| 路径 | `/api/post/{id}` |
| 鉴权 | 需要（仅作者本人） |

> 软删除：`status` 设为 0

**涉及表**：`t_post`

---

#### 3.2.5 关注流 Feed

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/post/feed/following?page=1&size=10` |
| 鉴权 | 需要 |

**功能说明**：获取当前用户关注的用户所发布的帖子，按时间倒序

**SQL 逻辑**：
```sql
SELECT p.* FROM t_post p
JOIN t_follow f ON p.user_id = f.followee_id
WHERE f.follower_id = #{currentUserId} AND p.status = 1
ORDER BY p.created_at DESC
```

**涉及表**：`t_post` JOIN `t_follow` JOIN `t_user`（author信息）

---

#### 3.2.6 推荐流 Feed

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/post/feed/recommend?page=1&size=10` |
| 鉴权 | 无 |

**功能说明**：按热度排序展示帖子（无需登录即可访问）

**热度算法**（在 SQL 或 Service 层计算）：
```
score = (like_count × 3 + reply_count × 5 + view_count × 1)
        / POW(TIMESTAMPDIFF(HOUR, created_at, NOW()) + 2, 1.5)
```

> 可在 `t_post` 表增加 `heat_score` 冗余字段，定时任务每日更新

**涉及表**：`t_post` JOIN `t_user`

---

#### 3.2.7 社区帖子列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/post/list?page=1&size=10&sort=latest&category=guide` |
| 鉴权 | 无 |

**Query Parameters**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| size | int | 否 | 每页条数，默认10 |
| sort | string | 否 | `latest`=最新，`hot`=最热 |
| category | string | 否 | 分类：`all`/`guide`/`discuss`/`help`/`share`/`news` |
| gameId | number | 否 | 筛选关联某游戏的帖子（游戏详情页使用） |

> 前端 `category` 值映射：
> - `all` → 不筛选
> - `guide` → 攻略
> - `discuss` → 讨论
> - `help` → 求助
> - `share` → 分享
> - `news` → 新闻

**涉及表**：`t_post` JOIN `t_user`

---

#### 3.2.8 搜索帖子

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/post/search?keyword=xxx&page=1&size=20` |
| 鉴权 | 无 |

**功能说明**：按 `title` 和 `content` 模糊匹配

**涉及表**：`t_post` JOIN `t_user`

---

#### 3.2.9 某用户的帖子

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/post/user/{userId}?page=1&size=10` |
| 鉴权 | 无 |

**涉及表**：`t_post` JOIN `t_user`

---

### 3.3 互动模块 `/api/interact`

#### 3.3.1 点赞

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/api/interact/like` |
| 鉴权 | 需要 |

**请求体**：
```json
{
  "targetType": 1,
  "targetId": 123
}
```

| targetType | 说明 |
|------------|------|
| 1 | 帖子 |
| 2 | 回复 |

**功能说明**：切换点赞状态
- 未点赞 → 创建记录，对应目标 `like_count + 1`
- 已点赞 → 删除记录，对应目标 `like_count - 1`（幂等操作）

**涉及表**：`t_like`、`t_post`/`t_reply`、`t_notification`

---

#### 3.3.2 取消点赞

| 项 | 内容 |
|----|------|
| 方法 | `DELETE` |
| 路径 | `/api/interact/like` |
| 鉴权 | 需要 |

**请求体**：同 3.3.1

> 功能上与 POST `/like` 的"已点赞再点"等价，为保证前端语义清晰，此接口仅做取消操作

**涉及表**：`t_like`、`t_post`/`t_reply`

---

#### 3.3.3 发表回复

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/api/interact/reply` |
| 鉴权 | 需要 |

**请求体**：
```json
{
  "postId": 123,
  "content": "string (必填, 最长500)",
  "parentId": "number|null (可选, 楼中楼, 回复某条回复的ID)",
  "replyToUserId": "number|null (可选, 被回复的用户ID)"
}
```

**功能说明**：
1. 创建回复记录
2. 帖子 `reply_count + 1`
3. 发送通知给帖子作者（若回复的是回复，则通知该回复作者）

**涉及表**：`t_reply`、`t_post`、`t_notification`

---

#### 3.3.4 删除回复

| 项 | 内容 |
|----|------|
| 方法 | `DELETE` |
| 路径 | `/api/interact/reply/{id}` |
| 鉴权 | 需要（仅回复作者） |

**涉及表**：`t_reply`、`t_post`（`reply_count - 1`）

---

#### 3.3.5 帖子回复列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/interact/replies/{postId}?page=1&size=20` |
| 鉴权 | 无 |

**响应 data**（分页）：
```json
{
  "records": [
    {
      "id": 1,
      "content": "写得真好！",
      "createdAt": "2026-05-27T12:00:00",
      "likeCount": 5,
      "parentId": null,
      "user": {
        "id": 2,
        "nickname": "玩家二号",
        "username": "player2",
        "avatar": "..."
      }
    }
  ],
  "total": 32,
  "pages": 2
}
```

> 前端同时兼容 `r.user` 和 `r.author` 两种字段路径

**涉及表**：`t_reply` JOIN `t_user`

---

#### 3.3.6 收藏帖子

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/api/interact/favorite/{postId}` |
| 鉴权 | 需要 |

**涉及表**：`t_favorite`

---

#### 3.3.7 取消收藏

| 项 | 内容 |
|----|------|
| 方法 | `DELETE` |
| 路径 | `/api/interact/favorite/{postId}` |
| 鉴权 | 需要 |

**涉及表**：`t_favorite`

---

#### 3.3.8 我的收藏列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/interact/favorites?page=1&size=10` |
| 鉴权 | 需要 |

**响应 data**：分页的帖子列表（每条格式同帖子卡片）

**涉及表**：`t_favorite` JOIN `t_post` JOIN `t_user`

---

### 3.4 游戏模块 `/api/game`

#### 3.4.1 游戏列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/game/list?page=1&size=12&platform=pc |
| 鉴权 | 无 |

**Query Parameters**：

| 参数 | 类型 | 说明 |
|------|------|------|
| page | int | 页码 |
| size | int | 每页条数 |
| platform | string | 平台筛选：`all`/`pc`/`ps5`/`xbox`/`switch` |

**响应 data**（分页）：
```json
{
  "records": [
    {
      "id": 1,
      "name": "艾尔登法环",
      "cover": "https://...",
      "description": "...",
      "developer": "FromSoftware",
      "publisher": "Bandai Namco",
      "releaseDate": "2022-02-25",
      "platform": "PC,PS5,Xbox",
      "tags": "魂系,开放世界,RPG",
      "rating": 9.5,
      "ratingCount": 1200
    }
  ],
  "total": 50,
  "pages": 5
}
```

**涉及表**：`t_game`

---

#### 3.4.2 游戏详情

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/game/{id}` |
| 鉴权 | 无 |

**响应 data**：同列表项，额外包含 `relatedPostCount` 等

**涉及表**：`t_game`

---

#### 3.4.3 推荐游戏

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/game/recommend` |
| 鉴权 | 无 |

**功能说明**：返回推荐游戏列表，用于侧边栏展示。建议返回 `is_recommend=1` 且评分最高的前 5-6 个游戏。

**涉及表**：`t_game`

---

#### 3.4.4 热门话题（侧边栏）

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/post/feed/recommend?page=1&size=6` |
| 鉴权 | 无 |

> 侧边栏"热门话题"实际复用推荐流接口取前 6 条，无需单独接口。

---

#### 3.4.5 游戏评分

| 项 | 内容 |
|----|------|
| 方法 | `POST` |
| 路径 | `/api/game/rate` |
| 鉴权 | 需要 |

**请求体**：
```json
{
  "gameId": 1,
  "score": 9.0,
  "review": "string (可选, 评价内容)"
}
```

> - `score` 范围 1.0 ~ 10.0，精确到 0.5
> - 同一用户对同一游戏只能有一条评分记录（唯一约束）
> - 评分后需更新 `t_game.rating`（平均值）和 `t_game.rating_count`

**涉及表**：`t_game_rating`、`t_game`

---

#### 3.4.6 游戏评价列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/game/{gameId}/ratings?page=1&size=10` |
| 鉴权 | 无 |

**响应 data**（分页）：
```json
{
  "records": [
    {
      "id": 1,
      "score": 9.5,
      "review": "神作！",
      "user": {
        "id": 2,
        "nickname": "玩家二号",
        "username": "player2",
        "avatar": "..."
      },
      "createdAt": "2026-05-27T12:00:00"
    }
  ],
  "total": 100,
  "pages": 10
}
```

**涉及表**：`t_game_rating` JOIN `t_user`

---

#### 3.4.7 搜索游戏

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/game/search?keyword=xxx&page=1&size=20` |
| 鉴权 | 无 |

> 按 `name` 模糊搜索，也用于发帖页关联游戏搜索框

**涉及表**：`t_game`

---

### 3.5 通知模块 `/api/notification`

#### 3.5.1 通知列表

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/notification/list?page=1&size=50` |
| 鉴权 | 需要 |

**响应 data**：
```json
{
  "records": [
    {
      "id": 1,
      "type": 1,
      "content": "赞了你的帖子",
      "message": "赞了你的帖子",
      "isRead": false,
      "targetType": 1,
      "targetId": 123,
      "createdAt": "2026-05-27T12:00:00",
      "sender": {
        "id": 2,
        "nickname": "玩家二号",
        "username": "player2",
        "avatar": "..."
      }
    }
  ]
}
```

**type 枚举**：

| 值 | 类型 | 说明 |
|----|------|------|
| 1 | 点赞 | 有人赞了你的帖子/回复 |
| 2 | 回复 | 有人回复了你的帖子/回复 |
| 3 | 关注 | 有人关注了你 |
| 4 | 系统 | 系统通知 |

**涉及表**：`t_notification` JOIN `t_user`（sender）

---

#### 3.5.2 未读通知数

| 项 | 内容 |
|----|------|
| 方法 | `GET` |
| 路径 | `/api/notification/unread-count` |
| 鉴权 | 需要 |

**响应 data**：
```json
{ "count": 5 }
```

> 前端兼容 `count`、`unreadCount`、以及直接返回数字 `5` 三种格式

**涉及表**：`t_notification`

---

#### 3.5.3 标记已读

| 项 | 内容 |
|----|------|
| 方法 | `PUT` |
| 路径 | `/api/notification/read/{id}` |
| 鉴权 | 需要 |

**涉及表**：`t_notification`

---

#### 3.5.4 全部已读

| 项 | 内容 |
|----|------|
| 方法 | `PUT` |
| 路径 | `/api/notification/read-all` |
| 鉴权 | 需要 |

> 将当前用户所有未读通知标记为已读

**涉及表**：`t_notification`

---

## 四、接口汇总

| 模块 | 数量 | 接口 |
|------|------|------|
| 用户 `/api/user` | 10 | register, login, info, `{id}`, profile, password, follow/`{id}`, follow/`{id}` (DELETE), `{id}`/followers, `{id}`/followees |
| 帖子 `/api/post` | 9 | create, `{id}`, `{id}` (PUT), `{id}` (DELETE), feed/following, feed/recommend, list, search, user/`{userId}` |
| 互动 `/api/interact` | 8 | like, like (DELETE), reply, reply/`{id}` (DELETE), replies/`{postId}`, favorite/`{postId}`, favorite/`{postId}` (DELETE), favorites |
| 游戏 `/api/game` | 7 | list, `{id}`, recommend, rate, `{gameId}`/ratings, search |
| 通知 `/api/notification` | 4 | list, unread-count, read/`{id}`, read-all |
| **合计** | **38** | |

---

## 五、补充说明

### 5.1 前端兼容性注意事项

前端做了大量兜底兼容，后端实现时只需按一种标准输出即可：

| 场景 | 前端兼容逻辑 |
|------|-------------|
| 分页格式 | 依次尝试 `records` → `list` → `content` |
| 页码字段 | 依次尝试 `pages` → `totalPage` → `totalPages` |
| 时间字段 | 兼容 `createdAt` / `createTime` |
| 用户字段 | 兼容 `r.user` / `r.author` |
| 字段命名 | 兼容驼峰和下划线 |
| 通知内容 | 兼容 `content` / `message` |
| 未读数 | 兼容 `count` / `unreadCount` / 数字 |
| 点赞返回 | `json.code === 200` 或 `json.code === 0` |

### 5.2 通知触发时机

| 操作 | 通知接收者 | type |
|------|-----------|------|
| 点赞帖子 | 帖子作者 | 1 |
| 点赞回复 | 回复作者 | 1 |
| 回复帖子 | 帖子作者 | 2 |
| 回复回复(楼中楼) | 被回复者 | 2 |
| 关注用户 | 被关注者 | 3 |

### 5.3 计数器更新建议

| 表 | 字段 | 触发操作 |
|----|------|---------|
| t_post | like_count | 点赞/取消点赞 |
| t_post | reply_count | 发表回复/删除回复 |
| t_post | view_count | 每次访问详情页 +1 |
| t_post | share_count | 每次分享 +1 |
| t_reply | like_count | 点赞/取消点赞回复 |
| t_game | rating | 评分后重新计算平均值 |
| t_game | rating_count | 评分后 +1 |
