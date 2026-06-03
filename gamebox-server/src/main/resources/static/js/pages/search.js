/**
 * 全局搜索页
 */
import { postApi, gameApi } from '../api.js';
import { createPostCard, createGameCard, emptyState } from '../components.js';

export async function render(container) {
  container.innerHTML = `
    <div class="page-section">
      <div class="search-header">
        <h2>&#128269; 搜索</h2>
        <p class="query">输入关键词搜索帖子和游戏</p>
      </div>
      <div style="margin-bottom:16px">
        <div style="display:flex;gap:8px">
          <input type="text" id="searchKeyword" placeholder="搜索你感兴趣的内容..." style="flex:1;height:46px;padding:0 16px;border:1px solid var(--border);border-radius:var(--r-full);background:var(--bg-input);font-size:var(--t-base);outline:none;color:var(--text-primary)" autofocus
            onkeydown="if(event.key==='Enter')window.$dispatch('doSearch',this.value.trim())">
          <button class="btn btn-primary" id="searchBtn">搜索</button>
        </div>
      </div>
      <div class="tabs search-tabs" id="searchTabs">
        <button class="tab active" data-tab="posts">帖子</button>
        <button class="tab" data-tab="games">游戏</button>
      </div>
      <div id="searchLoading" style="display:none">${emptyState('&#9203;','','搜索中...')}</div>
      <div id="searchResults">${emptyState('&#128269;','','输入关键词开始搜索')}</div>
    </div>`;

  let currentTab = 'posts';

  container.querySelector('#searchTabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    container.querySelectorAll('#searchTabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentTab = tab.dataset.tab;
    const kw = container.querySelector('#searchKeyword').value.trim();
    if (kw) doSearch(container, kw, currentTab);
  });

  container.querySelector('#searchBtn').addEventListener('click', () => {
    const kw = container.querySelector('#searchKeyword').value.trim();
    if (kw) doSearch(container, kw, currentTab);
  });

  window.addEventListener('doSearch', e => {
    if (e.detail) {
      container.querySelector('#searchKeyword').value = e.detail;
      doSearch(container, e.detail, currentTab);
    }
  });
}

async function doSearch(container, keyword, tab) {
  const loading = container.querySelector('#searchLoading');
  const results = container.querySelector('#searchResults');

  loading.style.display = 'block';
  results.innerHTML = '';

  try {
    if (tab === 'posts') {
      const data = await postApi.search(keyword, 1, 20);
      const records = Array.isArray(data) ? data : (data?.records || data?.list || data?.content || []);
      loading.style.display = 'none';
      results.innerHTML = records.length
        ? records.map(p => createPostCard(p)).join('')
        : emptyState('&#128221;', '未找到相关帖子', '换个关键词试试');
    } else {
      const data = await gameApi.search(keyword, 1, 20);
      const records = Array.isArray(data) ? data : (data?.records || data?.list || data?.content || []);
      loading.style.display = 'none';
      results.innerHTML = records.length
        ? `<div class="game-grid">${records.map(g => createGameCard(g)).join('')}</div>`
        : emptyState('&#127918;', '未找到相关游戏', '换个关键词试试');
    }
  } catch (err) {
    loading.style.display = 'none';
    results.innerHTML = `<div class="state-container state-error"><div class="state-icon">&#9888;</div><div class="state-desc">${err.message}</div></div>`;
  }
}
