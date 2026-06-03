/**
 * GameBox — Application Entry
 * 初始化路由、渲染页面、全局事件绑定
 */
import { store } from './store.js';
import { initRouter, navigate } from './router.js';
import { renderNavbar, renderSidebar, showToast } from './components.js';
import { gameApi, notificationApi, userApi } from './api.js';

// ==================== 应用初始化 ====================
async function init() {
  // 从 localStorage 恢复登录态
  store.init();
  await refreshCurrentUser();

  // 渲染静态外壳（导航栏 + 侧边栏）
  refreshLayout();

  // 启动路由
  initRouter(handleRoute);

  // 绑定全局事件
  bindGlobalEvents();

  // 轮询未读通知
  pollUnreadCount();
}

// ==================== 路由处理 ====================
async function handleRoute(page, params) {
  const app = document.getElementById('app');

  // 更新导航栏激活状态
  refreshNavActive();

  switch (page) {
    case 'home':
      const { render: renderHome } = await import('./pages/home.js');
      await renderHome(app);
      break;

    case 'community':
      const { render: renderCommunity } = await import('./pages/community.js');
      await renderCommunity(app);
      break;

    case 'post-detail':
      const { render: renderPostDetail } = await import('./pages/post-detail.js');
      await renderPostDetail(app, params[0]);
      break;

    case 'create-post':
      const { render: renderCreatePost } = await import('./pages/create-post.js');
      await renderCreatePost(app);
      break;

    case 'games':
      const { render: renderGames } = await import('./pages/games.js');
      await renderGames(app);
      break;

    case 'game-detail':
      const { render: renderGameDetail } = await import('./pages/game-detail.js');
      await renderGameDetail(app, params[0]);
      break;

    case 'profile':
      const { render: renderProfile } = await import('./pages/profile.js');
      await renderProfile(app, params[0]);
      break;

    case 'settings':
      const { render: renderSettings } = await import('./pages/settings.js');
      await renderSettings(app);
      break;

    case 'notifications':
      const { render: renderNotifications } = await import('./pages/notifications.js');
      await renderNotifications(app);
      break;

    case 'help':
      const { render: renderHelp } = await import('./pages/help.js');
      await renderHelp(app);
      break;

    case 'login':
      const { renderLogin } = await import('./pages/login.js');
      await renderLogin(app);
      break;

    case 'register':
      const { renderRegister } = await import('./pages/login.js');
      await renderRegister(app);
      break;

    case 'search':
      const { render: renderSearch } = await import('./pages/search.js');
      await renderSearch(app);
      break;

    default:
      app.innerHTML = '<div class="state-container"><div class="state-icon">&#128566;</div><div class="state-title">页面未找到</div><a class="btn btn-outline" href="#/">返回首页</a></div>';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== 全局事件 ====================
function bindGlobalEvents() {
  // 导航事件
  window.addEventListener('nav', e => {
    closeUserMenu();
    navigate(e.detail);
  });

  window.addEventListener('toggle-user-menu', () => {
    const menu = document.getElementById('userMenu');
    if (menu) menu.classList.toggle('open');
  });

  // 搜索事件
  window.addEventListener('search', e => {
    const keyword = e.detail;
    if (keyword) {
      navigate('/search');
      // 延迟触发搜索（等 search 页面加载完）
      setTimeout(() => window.$dispatch('doSearch', keyword), 200);
    }
  });

  // 退出登录
  window.addEventListener('logout', () => {
    closeUserMenu();
    store.logout();
    refreshLayout();
    navigate('/');
    showToast('已退出登录', 'info');
  });

  // 认证过期
  window.addEventListener('auth-expired', () => {
    store.logout();
    refreshLayout();
    navigate('/login');
    showToast('登录已过期，请重新登录', 'error');
  });

  // 监听 hashchange 以更新导航栏状态
  window.addEventListener('hashchange', () => {
    closeUserMenu();
    refreshNavActive();
  });

  document.addEventListener('click', closeUserMenu);
}

// ==================== 布局刷新 ====================
function refreshLayout() {
  // 导航栏
  const navbarEl = document.getElementById('navbar');
  if (navbarEl) navbarEl.innerHTML = renderNavbar();

  // 侧边栏
  refreshSidebar();
}

function refreshNavActive() {
  const hash = window.location.hash || '#/';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    a.classList.toggle('active', hash.startsWith(href) && href !== '#/' ? true : hash === href);
  });
}

async function refreshSidebar() {
  const sidebarEl = document.getElementById('sidebar');
  if (!sidebarEl) return;

  // 尝试加载热门帖子和推荐游戏
  let hotTopics = [], recommendGames = [];
  try {
    const posts = await gameApi.getRecommend();
    hotTopics = Array.isArray(posts) ? posts.slice(0, 6) : ((posts?.records || posts?.list || []).slice(0, 6));
  } catch (e) {}
  try {
    const games = await gameApi.getRecommend();
    recommendGames = Array.isArray(games) ? games : (games?.records || games?.list || []);
  } catch (e) {}

  sidebarEl.innerHTML = renderSidebar(hotTopics, recommendGames);
}

// ==================== 未读通知轮询 ====================
async function pollUnreadCount() {
  if (!store.get('isLoggedIn')) return;
  try {
    const count = await notificationApi.getUnreadCount();
    const unread = typeof count === 'number' ? count : (count?.count || count?.unreadCount || 0);
    store.set('unreadCount', unread);
    // 更新通知红点
    const badge = document.querySelector('.notify-badge');
    if (badge) badge.classList.toggle('show', unread > 0);
  } catch (e) {}
}

function closeUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) menu.classList.remove('open');
}

async function refreshCurrentUser() {
  if (!store.get('isLoggedIn')) return;
  try {
    const user = await userApi.getInfo();
    localStorage.setItem('user', JSON.stringify(user));
    store.set('user', user);
  } catch (e) {
    if (e.message.includes('登录') || e.message.includes('过期')) {
      store.logout();
    }
  }
}

// 监听登录态变化以更新导航栏
store.on('isLoggedIn', () => {
  refreshLayout();
  if (store.get('isLoggedIn')) pollUnreadCount();
});
store.on('unreadCount', (count) => {
  const badge = document.querySelector('.notify-badge');
  if (badge) badge.classList.toggle('show', count > 0);
});

// ==================== 启动 ====================
init();

// 30 秒轮询未读数
setInterval(pollUnreadCount, 30000);
