/**
 * 游戏详情页
 */
import { store } from '../store.js';
import { gameApi, postApi } from '../api.js';
import { showToast, emptyState } from '../components.js';

export async function render(container, gameId) {
  container.innerHTML = `<div class="page-section"><div class="game-detail"><div class="skeleton skel-title"></div><div class="skeleton skel-text"></div></div></div>`;

  try {
    const game = await gameApi.getById(gameId);
    container.querySelector('.page-section').innerHTML = `
      <div class="game-detail">
        <div class="gd-header">
          <div class="gd-cover" style="background:linear-gradient(135deg,var(--brand),var(--brand-light))">
            ${game.cover ? `<img src="${game.cover}" alt="${game.name}" onerror="this.style.display='none';this.parentElement.textContent='${(game.name||'G').charAt(0)}'">` : (game.name||'G').charAt(0)}
          </div>
          <div class="gd-info">
            <h1 class="gd-name">${game.name || '未知游戏'}</h1>
            <div class="gd-meta">
              <div>开发商：${game.developer || '未知'}</div>
              <div>发行商：${game.publisher || '未知'}</div>
              <div>平台：${game.platform || '多平台'}</div>
              ${game.releaseDate ? `<div>发行日期：${game.releaseDate}</div>` : ''}
            </div>
            <div class="gd-rating-row">
              <span class="gd-rating-num">${game.rating || '-'}</span>
              <span class="gd-rating-count">/ 10 &nbsp;(${game.ratingCount || 0} 人评分)</span>
            </div>
            <div class="gd-desc">${game.description || game.desc || '暂无介绍'}</div>
            ${store.get('isLoggedIn') ? `
              <div style="display:flex;gap:8px">
                <button class="btn btn-outline btn-sm" onclick="$dispatch('createRating',${game.id})">&#9733; 评分</button>
                <button class="btn btn-outline btn-sm" onclick="$dispatch('createPostForGame',${game.id})">&#9998; 写评价</button>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="section-header"><div class="section-title">相关帖子</div></div>
        <div id="gamePosts">${emptyState('&#128221;', '', '加载中...')}</div>
      </div>`;

    // 加载相关帖子
    try {
      const postsData = await postApi.getList({ gameId, page: 1, size: 5, sort: 'latest' });
      const records = Array.isArray(postsData) ? postsData : (postsData?.records || postsData?.list || []);
      const postsContainer = container.querySelector('#gamePosts');
      if (records.length === 0) {
        postsContainer.innerHTML = emptyState('&#128221;', '', '暂无相关帖子');
      } else {
        const { createPostCard } = await import('../components.js');
        postsContainer.innerHTML = records.map(p => createPostCard(p)).join('');
      }
    } catch (e) {
      container.querySelector('#gamePosts').innerHTML = '<div style="color:var(--text-muted);font-size:13px">加载相关帖子失败</div>';
    }

  } catch (err) {
    container.querySelector('.page-section').innerHTML = `<div class="state-container state-error"><div class="state-icon">&#9888;</div><div class="state-title">加载失败</div><div class="state-desc">${err.message}</div></div>`;
  }
}
