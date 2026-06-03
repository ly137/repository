/**
 * 首页 — 关注流 / 推荐流
 */
import { store } from '../store.js';
import { postApi } from '../api.js';
import { createPostCard, skeletonCard, emptyState } from '../components.js';

let currentFeed = 'recommend';
let page = 1;
let totalPage = 1;

export async function render(container) {
  container.innerHTML = `
    <div class="page-section">
      <div class="hero-banner">
        <div class="hero-content">
          <span class="hero-badge">&#128293; 热门推荐</span>
          <h1 class="hero-title">发现最热游戏讨论<br>加入<span class="accent">玩家社区</span></h1>
          <p class="hero-subtitle">分享你的游戏心得，找到志同道合的玩家</p>
          <div class="hero-stats">
            <div class="hero-stat"><div class="hs-value">--</div><div class="hs-label">活跃玩家</div></div>
            <div class="hero-stat"><div class="hs-value">--</div><div class="hs-label">今日帖子</div></div>
            <div class="hero-stat"><div class="hs-value">--</div><div class="hs-label">收录游戏</div></div>
          </div>
          <button class="btn btn-primary" onclick="$dispatch('nav','/community')">进入社区 &rarr;</button>
        </div>
      </div>
      <div class="tabs" id="homeTabs" role="tablist">
        <button class="tab${currentFeed === 'following' ? ' active' : ''}" data-feed="following">关注</button>
        <button class="tab${currentFeed === 'recommend' ? ' active' : ''}" data-feed="recommend">推荐</button>
      </div>
      <div id="feedLoading">${skeletonCard()}${skeletonCard()}</div>
      <div id="feedContent"></div>
      <div id="feedPagination"></div>
    </div>`;

  // Tab 切换
  container.querySelector('#homeTabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    container.querySelectorAll('#homeTabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFeed = tab.dataset.feed;
    page = 1;
    loadFeed(container);
  });

  await loadFeed(container);
}

async function loadFeed(container) {
  const loading = container.querySelector('#feedLoading');
  const content = container.querySelector('#feedContent');
  const pagination = container.querySelector('#feedPagination');

  loading.style.display = 'block';
  content.innerHTML = '';
  pagination.innerHTML = '';

  try {
    let data;
    if (currentFeed === 'following') {
      if (!store.get('isLoggedIn')) {
        loading.style.display = 'none';
        content.innerHTML = emptyState('&#128075;', '还没有关注任何人', '关注你喜欢的玩家，这里会展示他们的最新动态', '去发现内容', "$dispatch('nav','/community')");
        return;
      }
      data = await postApi.getFollowingFeed(page, 10);
    } else {
      data = await postApi.getRecommendFeed(page, 10);
    }

    loading.style.display = 'none';

    // 解析分页数据
    let records = [], total = 0, pages = 1;
    if (Array.isArray(data)) {
      records = data;
    } else if (data?.records) {
      records = data.records;
      total = data.total || 0;
      pages = data.pages || 1;
    } else if (data?.list) {
      records = data.list;
      total = data.total || 0;
      pages = data.totalPage || 1;
    } else if (data?.content) {
      records = data.content;
      total = data.totalElements || 0;
      pages = data.totalPages || 1;
    }

    totalPage = pages;

    if (records.length === 0) {
      content.innerHTML = emptyState('&#128221;', '暂无内容', '当前列表还没有帖子，去看看其他内容吧');
      return;
    }

    content.innerHTML = records.map(p => createPostCard(p)).join('');

    if (pages > 1) {
      const { renderPagination } = await import('../components.js');
      pagination.innerHTML = renderPagination(page, pages, null);
      pagination.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          const txt = btn.textContent.trim();
          if (txt === '«') page = Math.max(1, page - 1);
          else if (txt === '»') page = Math.min(pages, page + 1);
          else page = parseInt(txt);
          if (!isNaN(page)) loadFeed(container);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    }
  } catch (err) {
    loading.style.display = 'none';
    content.innerHTML = `<div class="state-container state-error"><div class="state-icon">&#9888;</div><div class="state-desc">${err.message}</div></div>`;
  }
}
