/**
 * 游戏库页 — 游戏列表
 */
import { gameApi } from '../api.js';
import { createGameCard, skeletonCard, renderPagination, emptyState } from '../components.js';

let currentPlatform = 'all';
let page = 1;
let totalPage = 1;

export async function render(container) {
  container.innerHTML = `
    <div class="page-section">
      <div class="section-header">
        <div class="section-title">&#127918; 游戏库</div>
        <button class="btn btn-outline btn-sm" onclick="$dispatch('nav','/search')">&#128269; 搜索游戏</button>
      </div>
      <div class="filter-bar" id="gameFilters">
        <button class="filter-chip active" data-filter="all">全部</button>
        <button class="filter-chip" data-filter="pc">PC</button>
        <button class="filter-chip" data-filter="ps5">PS5</button>
        <button class="filter-chip" data-filter="xbox">Xbox</button>
        <button class="filter-chip" data-filter="switch">Switch</button>
      </div>
      <div id="gamesLoading">${skeletonCard()}</div>
      <div class="game-grid" id="gamesGrid"></div>
      <div id="gamesPagination"></div>
    </div>`;

  container.querySelector('#gameFilters').addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    container.querySelectorAll('#gameFilters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentPlatform = chip.dataset.filter;
    page = 1;
    loadGames(container);
  });

  await loadGames(container);
}

async function loadGames(container) {
  const loading = container.querySelector('#gamesLoading');
  const grid = container.querySelector('#gamesGrid');
  const pagination = container.querySelector('#gamesPagination');

  loading.style.display = 'block';
  grid.innerHTML = '';
  pagination.innerHTML = '';

  try {
    const params = { page, size: 12 };
    if (currentPlatform !== 'all') params.platform = currentPlatform;
    const data = await gameApi.getList(params);
    loading.style.display = 'none';

    let records = Array.isArray(data) ? data : (data?.records || data?.list || data?.content || []);
    let pages = data?.pages || data?.totalPage || data?.totalPages || 1;
    totalPage = pages;

    if (records.length === 0) {
      grid.innerHTML = emptyState('&#127918;', '暂无游戏', '该平台暂无收录游戏');
      return;
    }
    grid.innerHTML = records.map(g => createGameCard(g)).join('');
    if (pages > 1) {
      pagination.innerHTML = renderPagination(page, pages, null);
      pagination.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          const txt = btn.textContent.trim();
          if (txt === '«') page = Math.max(1, page - 1);
          else if (txt === '»') page = Math.min(pages, page + 1);
          else page = parseInt(txt);
          if (!isNaN(page)) { loadGames(container); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        });
      });
    }
  } catch (err) {
    loading.style.display = 'none';
    grid.innerHTML = `<div class="state-container state-error"><div class="state-icon">&#9888;</div><div class="state-desc">${err.message}</div></div>`;
  }
}
