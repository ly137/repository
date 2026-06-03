/**
 * 路由系统 — 基于 hash 的简易 SPA 路由
 * 路由： #/ , #/community, #/post/:id, #/create, #/games, #/game/:id,
 *        #/profile/:id, #/settings, #/notifications, #/help, #/login, #/register, #/search
 */

export function initRouter(renderFn) {
  // 路由表
  const routes = [
    { pattern: /^#\/$/,                              page: 'home' },
    { pattern: /^#\/community\/?$/,                  page: 'community' },
    { pattern: /^#\/post\/(\d+)\/?$/,                page: 'post-detail' },
    { pattern: /^#\/create\/?$/,                     page: 'create-post' },
    { pattern: /^#\/games\/?$/,                      page: 'games' },
    { pattern: /^#\/game\/(\d+)\/?$/,                page: 'game-detail' },
    { pattern: /^#\/profile\/(\d+)\/?$/,             page: 'profile' },
    { pattern: /^#\/settings\/?$/,                   page: 'settings' },
    { pattern: /^#\/notifications\/?$/,              page: 'notifications' },
    { pattern: /^#\/help\/?$/,                       page: 'help' },
    { pattern: /^#\/login\/?$/,                      page: 'login' },
    { pattern: /^#\/register\/?$/,                   page: 'register' },
    { pattern: /^#\/search\/?$/,                     page: 'search' },
  ];

  /** 解析当前 hash */
  function parseRoute() {
    const hash = window.location.hash || '#/';
    for (const route of routes) {
      const match = hash.match(route.pattern);
      if (match) {
        return { page: route.page, params: match.slice(1) };
      }
    }
    // 404 默认跳到首页
    return { page: 'home', params: [] };
  }

  /** 处理路由变化 */
  function handleRoute() {
    const { page, params } = parseRoute();
    renderFn(page, params);
  }

  // 监听 hashchange
  window.addEventListener('hashchange', handleRoute);
  // 初始加载
  handleRoute();

  return { parseRoute, handleRoute };
}

/** 编程式导航 */
export function navigate(path) {
  window.location.hash = path;
}

/** 获取当前路由 */
export function getCurrentRoute() {
  return window.location.hash || '#/';
}
