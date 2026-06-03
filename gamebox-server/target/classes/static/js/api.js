/**
 * API 服务层 — 封装所有后端接口请求
 * Base URL: http://localhost:8080/api
 * 统一响应格式: { code: 200, message: "success", data: {} }
 */

const BASE = 'http://localhost:8080/api';

/**
 * 统一请求方法
 */
async function request(url, options = {}) {
  const { silent, ...restOptions } = options;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(restOptions.headers || {}),
    },
    ...restOptions,
  };

  // 携带登录凭证（如果存在）
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(BASE + url, config);
    const json = await res.json();

    if (json.code === 200 || json.code === 0) {
      return json.data;
    }

    // 401 未登录
    if (json.code === 401) {
      if (!silent) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth-expired'));
      }
      throw new Error('登录已过期，请重新登录');
    }

    throw new Error(json.message || '请求失败');
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('网络连接失败，请检查后端服务是否启动');
    }
    throw err;
  }
}

// ==================== 用户接口 ====================
export const userApi = {
  /** 注册 */
  register(data) {
    return request('/user/register', { method: 'POST', body: JSON.stringify(data) });
  },

  /** 登录 */
  login(data) {
    return request('/user/login', { method: 'POST', body: JSON.stringify(data) });
  },

  /** 获取当前用户信息 */
  getInfo() {
    return request('/user/info');
  },

  /** 查看用户主页 */
  getUserById(id) {
    return request(`/user/${id}`);
  },

  /** 更新个人资料 */
  updateProfile(data) {
    return request('/user/profile', { method: 'PUT', body: JSON.stringify(data) });
  },

  /** 修改密码 */
  changePassword(data) {
    return request('/user/password', { method: 'PUT', body: JSON.stringify(data) });
  },

  /** 关注用户 */
  follow(id) {
    return request(`/user/follow/${id}`, { method: 'POST' });
  },

  /** 取消关注 */
  unfollow(id) {
    return request(`/user/follow/${id}`, { method: 'DELETE' });
  },

  /** 粉丝列表 */
  getFollowers(id, page = 1, size = 10) {
    return request(`/user/${id}/followers?page=${page}&size=${size}`);
  },

  /** 关注列表 */
  getFollowees(id, page = 1, size = 10) {
    return request(`/user/${id}/followees?page=${page}&size=${size}`);
  },
};

// ==================== 帖子接口 ====================
export const postApi = {
  /** 发布帖子 */
  create(data) {
    return request('/post', { method: 'POST', body: JSON.stringify(data) });
  },

  /** 帖子详情 */
  getById(id) {
    return request(`/post/${id}`);
  },

  /** 编辑帖子 */
  update(id, data) {
    return request(`/post/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  /** 删除帖子 */
  remove(id) {
    return request(`/post/${id}`, { method: 'DELETE' });
  },

  /** 关注流 */
  getFollowingFeed(page = 1, size = 10) {
    return request(`/post/feed/following?page=${page}&size=${size}`);
  },

  /** 推荐流 */
  getRecommendFeed(page = 1, size = 10) {
    return request(`/post/feed/recommend?page=${page}&size=${size}`);
  },

  /** 社区帖子列表 */
  getList(params = {}) {
    const q = new URLSearchParams(params).toString();
    return request(`/post/list?${q}`);
  },

  /** 搜索帖子 */
  search(keyword, page = 1, size = 10) {
    return request(`/post/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
  },

  /** 某用户的帖子 */
  getUserPosts(userId, page = 1, size = 10) {
    return request(`/post/user/${userId}?page=${page}&size=${size}`);
  },
};

// ==================== 互动接口 ====================
export const interactApi = {
  /** 点赞 */
  like(targetType, targetId) {
    return request('/interact/like', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId }),
    });
  },

  /** 取消点赞 */
  unlike(targetType, targetId) {
    return request('/interact/like', {
      method: 'DELETE',
      body: JSON.stringify({ targetType, targetId }),
    });
  },

  /** 发表回复 */
  reply(data) {
    return request('/interact/reply', { method: 'POST', body: JSON.stringify(data) });
  },

  /** 删除回复 */
  deleteReply(id) {
    return request(`/interact/reply/${id}`, { method: 'DELETE' });
  },

  /** 帖子回复列表 */
  getReplies(postId, page = 1, size = 20) {
    return request(`/interact/replies/${postId}?page=${page}&size=${size}`);
  },

  /** 收藏帖子 */
  favorite(postId) {
    return request(`/interact/favorite/${postId}`, { method: 'POST' });
  },

  /** 取消收藏 */
  unfavorite(postId) {
    return request(`/interact/favorite/${postId}`, { method: 'DELETE' });
  },

  /** 我的收藏 */
  getFavorites(page = 1, size = 10) {
    return request(`/interact/favorites?page=${page}&size=${size}`);
  },
};

// ==================== 游戏接口 ====================
export const gameApi = {
  /** 游戏列表 */
  getList(params = {}) {
    const q = new URLSearchParams(params).toString();
    return request(`/game/list?${q}`);
  },

  /** 游戏详情 */
  getById(id) {
    return request(`/game/${id}`);
  },

  /** 推荐游戏 */
  getRecommend() {
    return request('/game/recommend');
  },

  /** 游戏评分 */
  rate(data) {
    return request('/game/rate', { method: 'POST', body: JSON.stringify(data) });
  },

  /** 游戏评价列表 */
  getRatings(gameId, page = 1, size = 10) {
    return request(`/game/${gameId}/ratings?page=${page}&size=${size}`);
  },

  /** 搜索游戏 */
  search(keyword, page = 1, size = 10) {
    return request(`/game/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
  },
};

// ==================== 通知接口 ====================
export const notificationApi = {
  /** 通知列表 */
  getList(page = 1, size = 20) {
    return request(`/notification/list?page=${page}&size=${size}`);
  },

  /** 未读数量 */
  getUnreadCount() {
    return request('/notification/unread-count', { silent: true });
  },

  /** 标记已读 */
  markRead(id) {
    return request(`/notification/read/${id}`, { method: 'PUT' });
  },

  /** 全部已读 */
  markAllRead() {
    return request('/notification/read-all', { method: 'PUT' });
  },
};

export default { userApi, postApi, interactApi, gameApi, notificationApi };
