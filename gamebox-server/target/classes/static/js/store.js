/**
 * 状态管理 — 全局应用状态
 */
export const store = {
  _state: {
    user: null,        // 当前登录用户
    token: null,       // JWT token
    unreadCount: 0,    // 未读通知数
    isLoggedIn: false,
  },

  _listeners: {},

  /** 获取状态 */
  get(key) {
    return this._state[key];
  },

  /** 设置状态并通知监听器 */
  set(key, value) {
    this._state[key] = value;
    if (this._listeners[key]) {
      this._listeners[key].forEach(fn => fn(value));
    }
    // 通知全局变化
    if (this._listeners['*']) {
      this._listeners['*'].forEach(fn => fn(key, value));
    }
  },

  /** 批量设置 */
  setMany(obj) {
    Object.entries(obj).forEach(([k, v]) => this.set(k, v));
  },

  /** 监听状态变化 */
  on(key, fn) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(fn);
    return () => {
      this._listeners[key] = this._listeners[key].filter(f => f !== fn);
    };
  },

  /** 初始化 — 从 localStorage 恢复登录态 */
  init() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this._state.token = token;
      this._state.user = JSON.parse(user);
      this._state.isLoggedIn = true;
    }
  },

  /** 登录 */
  login(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.setMany({ token, user, isLoggedIn: true });
  },

  /** 登出 */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.setMany({ token: null, user: null, isLoggedIn: false, unreadCount: 0 });
  },
};
