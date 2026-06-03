/**
 * 通用组件 — 导航栏、侧边栏、帖子卡片等可复用 UI
 */
import { store } from './store.js';
import { navigate } from './router.js';
import { interactApi } from './api.js';

// ==================== 导航栏 ====================
export function renderNavbar() {
  const user = store.get('user');
  const unread = store.get('unreadCount');
  const isLoggedIn = store.get('isLoggedIn');
  const currentHash = window.location.hash || '#/';

  return `
    <nav class="navbar">
      <div class="logo" onclick="window.dispatchEvent(new CustomEvent('nav',{detail:'/'}))">
        <span class="logo-icon">G</span>GameBox
      </div>
      <div class="nav-links">
        <a href="#/" class="${currentHash.match(/^#\/$/) ? 'active' : ''}">首页</a>
        <a href="#/community" class="${currentHash.startsWith('#/community') ? 'active' : ''}">社区</a>
        <a href="#/games" class="${currentHash.startsWith('#/games') || currentHash.startsWith('#/game') ? 'active' : ''}">游戏库</a>
      </div>
      <div class="nav-search">
        <span class="s-icon">&#128269;</span>
        <input type="text" id="searchInput" placeholder="搜索帖子、游戏..." aria-label="搜索"
          onkeydown="if(event.key==='Enter')window.dispatchEvent(new CustomEvent('search',{detail:this.value}))">
      </div>
      <div class="nav-actions">
        <button class="notify-btn" aria-label="消息通知" onclick="window.dispatchEvent(new CustomEvent('nav',{detail:'/notifications'}))">
          &#128276;<span class="notify-badge${unread > 0 ? ' show' : ''}"></span>
        </button>
        ${isLoggedIn ? `
          <div class="user-menu-wrap" onclick="event.stopPropagation()">
            <button class="avatar-btn" onclick="$dispatch('toggle-user-menu')" aria-label="用户菜单" aria-haspopup="true">
              ${user?.avatar ? `<img src="${user.avatar}" alt="${user?.nickname || user?.username || '用户'}" onerror="this.remove()">` : (user?.nickname || user?.username || 'U').charAt(0).toUpperCase()}
            </button>
            <div class="user-menu" id="userMenu">
              <div class="user-menu-head">
                <div class="user-menu-avatar">
                  ${user?.avatar ? `<img src="${user.avatar}" alt="${user?.nickname || user?.username || '用户'}" onerror="this.remove()">` : (user?.nickname || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div class="user-menu-info">
                  <div class="user-menu-name">${user?.nickname || user?.username || '用户'}</div>
                  <div class="user-menu-id">@${user?.username || 'gamebox'}</div>
                </div>
              </div>
              <button class="user-menu-item" onclick="$dispatch('nav','/profile/${user?.id || ''}')"><span>&#128100;</span>个人主页</button>
              <button class="user-menu-item" onclick="$dispatch('nav','/settings')"><span>&#9881;</span>个人设置</button>
              <button class="user-menu-item" onclick="sessionStorage.setItem('profileTab','favorites');$dispatch('nav','/profile/${user?.id || ''}')"><span>&#11088;</span>我的收藏</button>
              <button class="user-menu-item" onclick="$dispatch('nav','/notifications')"><span>&#128276;</span>消息通知${unread > 0 ? `<em>${unread}</em>` : ''}</button>
              <button class="user-menu-item" onclick="$dispatch('nav','/help')"><span>&#10067;</span>帮助中心</button>
              <div class="user-menu-divider"></div>
              <button class="user-menu-item danger" onclick="$dispatch('logout')"><span>&#8617;</span>退出登录</button>
            </div>
          </div>
        ` : `
          <a class="btn btn-primary btn-sm" href="#/login">登录</a>
        `}
      </div>
    </nav>`;
}

// ==================== 侧边栏 ====================
export function renderSidebar(hotTopics = [], recommendGames = []) {
  return `
    <div class="widget">
      <div class="widget-header"><span class="w-icon">&#128293;</span>热门话题</div>
      ${hotTopics.length > 0
        ? hotTopics.map((t, i) => `
          <div class="hot-item" onclick="window.dispatchEvent(new CustomEvent('nav',{detail:'/post/${t.id}'}))">
            <span class="hot-rank ${i < 3 ? 'gold' : 'silver'}">${i + 1}</span>
            <span class="hot-title">${t.title || '热门话题'}</span>
            <span class="hot-count">${t.viewCount || t.views || ''}</span>
          </div>`).join('')
        : '<div style="padding:var(--s4) 0;text-align:center;font-size:var(--t-xs);color:var(--text-muted)">加载中...</div>'
      }
    </div>
    <div class="widget">
      <div class="widget-header"><span class="w-icon">&#11088;</span>推荐游戏</div>
      ${recommendGames.length > 0
        ? recommendGames.slice(0, 5).map(g => `
          <div class="game-mini" onclick="window.dispatchEvent(new CustomEvent('nav',{detail:'/game/${g.id}'}))">
            <div class="gm-cover" style="background:linear-gradient(135deg,var(--brand),var(--brand-light))">
              ${g.cover ? `<img src="${g.cover}" alt="${g.name}">` : (g.name||'G').charAt(0)}
            </div>
            <div class="gm-info">
              <div class="gm-name">${g.name || '游戏'}</div>
              <div class="gm-meta">${g.developer || ''}</div>
              <div class="gm-rating">${g.rating ? '&#9733; ' + g.rating : ''}</div>
            </div>
          </div>`).join('')
        : '<div style="padding:var(--s4) 0;text-align:center;font-size:var(--t-xs);color:var(--text-muted)">加载中...</div>'
      }
    </div>
    <div style="text-align:center;padding:var(--s4) 0">
      <div style="font-size:var(--t-xs);color:var(--text-muted)">GameBox &copy; 2026 游戏社区</div>
    </div>`;
}

// ==================== 帖子卡片 ====================
export function createPostCard(post, showExcerpt = true) {
  const catMap = { '攻略': 'cat-guide', '讨论': 'cat-discuss', '求助': 'cat-help', '分享': 'cat-share', '新闻': 'cat-news' };
  const catClass = catMap[post.category] || 'cat-guide';
  const tags = post.tags ? (Array.isArray(post.tags) ? post.tags : post.tags.split(',')) : [];

  return `
    <article class="post-card" onclick="$dispatch('nav','/post/${post.id}')" tabindex="0">
      <div class="pc-header">
        <div class="pc-avatar">${(post.author?.nickname || post.author?.username || 'U').charAt(0).toUpperCase()}</div>
        <div class="pc-user">
          <div class="pc-username">${post.author?.nickname || post.author?.username || '匿名用户'}</div>
          <div class="pc-time">${formatTime(post.createdAt || post.createTime)}</div>
        </div>
        ${post.category ? `<span class="pc-category ${catClass}">${post.category}</span>` : ''}
      </div>
      <h3 class="pc-title">${post.title || '无标题'}</h3>
      ${showExcerpt && post.content ? `<p class="pc-excerpt">${stripHtml(post.content)}</p>` : ''}
      ${post.coverImage || post.cover ? `<div class="pc-cover"><img src="${post.coverImage || post.cover}" alt="封面" loading="lazy" onerror="this.style.display='none'"></div>` : ''}
      ${tags.length > 0 ? `<div class="pc-tags">${tags.map(t => `<span class="pc-tag">#${t.trim()}</span>`).join('')}</div>` : ''}
      <div class="pc-stats">
        <span class="pc-stat${post.liked ? ' liked' : ''}" onclick="event.stopPropagation();$dispatch('like',{id:${post.id},el:this})" data-id="${post.id}">
          <span class="stat-icon">${post.liked ? '&#10084;' : '&#9825;'}</span> ${formatNum(post.likeCount || 0)}
        </span>
        <span class="pc-stat">&#128172; ${formatNum(post.replyCount || 0)}</span>
        <span class="pc-stat">&#128065; ${formatNum(post.viewCount || 0)}</span>
        <span class="pc-stat">&#128279; ${formatNum(post.shareCount || 0)}</span>
      </div>
    </article>`;
}

// ==================== 游戏卡片 ====================
export function createGameCard(game) {
  return `
    <article class="game-card" onclick="$dispatch('nav','/game/${game.id}')" tabindex="0" aria-label="${game.name}">
      <div class="gc-cover">
        <div class="gc-cover-bg" style="background:linear-gradient(135deg,var(--brand),var(--brand-light))">
          ${game.cover ? `<img src="${game.cover}" alt="${game.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<span style=\\'font-size:40px;font-weight:900;color:rgba(255,255,255,.2)\\'>${(game.name||'G').charAt(0)}</span>'">` : `<span style="font-size:40px;font-weight:900;color:rgba(255,255,255,.2)">${(game.name||'G').charAt(0)}</span>`}
        </div>
        ${game.rating ? `<div class="gc-rating">&#9733; ${game.rating}</div>` : ''}
      </div>
      <div class="gc-body">
        <div class="gc-name">${game.name || '未知游戏'}</div>
        <div class="gc-meta">${game.developer || ''}</div>
        <div class="gc-platforms">${game.platform || ''}</div>
      </div>
    </article>`;
}

// ==================== 骨架卡片 ====================
export function skeletonCard() {
  return `
    <div class="skel-card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <div class="skeleton skel-avatar"></div>
        <div style="flex:1"><div class="skeleton skel-text short"></div><div class="skeleton skel-text" style="width:40%"></div></div>
      </div>
      <div class="skeleton skel-title"></div>
      <div class="skeleton skel-text"></div>
      <div class="skeleton skel-text"></div>
      <div class="skeleton skel-text short"></div>
    </div>`;
}

// ==================== 分页组件 ====================
export function renderPagination(current, total, onPage) {
  if (total <= 1) return '';
  const pages = [];
  const maxShow = 5;
  let start = Math.max(1, current - Math.floor(maxShow / 2));
  let end = Math.min(total, start + maxShow - 1);
  if (end - start < maxShow - 1) start = Math.max(1, end - maxShow + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  return `
    <div class="pagination">
      <button ${current === 1 ? 'disabled' : ''} onclick="$dispatch('page',${current - 1})">&laquo;</button>
      ${pages.map(p => `<button class="${p === current ? 'active' : ''}" onclick="$dispatch('page',${p})">${p}</button>`).join('')}
      <button ${current === total ? 'disabled' : ''} onclick="$dispatch('page',${current + 1})">&raquo;</button>
      <span class="page-info">${current} / ${total}</span>
    </div>`;
}

// ==================== 空状态 ====================
export function emptyState(icon, title, desc, btnText, btnAction) {
  return `
    <div class="state-container state-empty">
      <div class="state-icon">${icon || '&#128221;'}</div>
      ${title ? `<div class="state-title">${title}</div>` : ''}
      <div class="state-desc">${desc || '暂无数据'}</div>
      ${btnText ? `<button class="btn btn-outline" onclick="${btnAction}">${btnText}</button>` : ''}
    </div>`;
}

// ==================== Toast ====================
export function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${type === 'success' ? '&#10003;' : type === 'error' ? '&#10007;' : '&#8505;'}</span> ${msg}`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 300ms ease-out'; setTimeout(() => t.remove(), 300); }, 2500);
}

// ==================== 工具函数 ====================
function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`;
  return d.toLocaleDateString('zh-CN');
}

function formatNum(n) {
  n = Number(n) || 0;
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toString();
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').substring(0, 200);
}

// ==================== 全局事件分发 ====================
window.$dispatch = function(eventName, detail) {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};
