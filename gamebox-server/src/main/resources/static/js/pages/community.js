/**
 * 社区页 — 帖子列表（分类筛选、分页）
 */
import { postApi } from '../api.js';
import { createPostCard, skeletonCard, renderPagination, emptyState } from '../components.js';

let currentFilter = 'all';
let page = 1;
let totalPage = 1;

export async function render(container) {
  container.innerHTML = `
    <div class="page-section">
      <div class="section-header">
        <div class="section-title"><span class="icon">&#128221;</span>社区广场</div>
        <button class="btn btn-primary" onclick="$dispatch('nav','/create')">&#9998; 发布帖子</button>
      </div>
      <div class="filter-bar" id="communityFilters" role="group">
        <button class="filter-chip active" data-filter="all">全部</button>
        <button class="filter-chip" data-filter="guide">攻略</button>
        <button class="filter-chip" data-filter="discuss">讨论</button>
        <button class="filter-chip" data-filter="help">求助</button>
        <button class="filter-chip" data-filter="share">分享</button>
        <button class="filter-chip" data-filter="news">新闻</button>
      </div>
      <div id="communityLoading">${skeletonCard()}${skeletonCard()}</div>
      <div id="communityContent"></div>
      <div id="communityPagination"></div>
    </div>`;

  container.querySelector('#communityFilters').addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    container.querySelectorAll('#communityFilters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    page = 1;
    loadPosts(container);
  });

  await loadPosts(container);
}

async function loadPosts(container) {
  const loading = container.querySelector('#communityLoading');
  const content = container.querySelector('#communityContent');
  const pagination = container.querySelector('#communityPagination');

  loading.style.display = 'block';
  content.innerHTML = '';
  pagination.innerHTML = '';

  try {
    const params = { page, size: 10, sort: 'latest' };
    if (currentFilter !== 'all') params.category = currentFilter;

    const data = await postApi.getList(params);
    loading.style.display = 'none';

    let records = Array.isArray(data) ? data : (data?.records || data?.list || data?.content || []);
    let pages = data?.pages || data?.totalPage || data?.totalPages || 1;
    totalPage = pages;

    if (records.length === 0) {
      content.innerHTML = emptyState('&#128221;', '该分类暂无帖子', '换个分类试试看');
      return;
    }
    content.innerHTML = records.map(p => createPostCard(p)).join('');
    if (pages > 1) {
      pagination.innerHTML = renderPagination(page, pages, null);
      pagination.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          const txt = btn.textContent.trim();
          if (txt === '«') page = Math.max(1, page - 1);
          else if (txt === '»') page = Math.min(pages, page + 1);
          else page = parseInt(txt);
          if (!isNaN(page)) { loadPosts(container); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        });
      });
    }
  } catch (err) {
    loading.style.display = 'none';
    content.innerHTML = `<div class="state-container state-error"><div class="state-icon">&#9888;</div><div class="state-desc">${err.message}</div></div>`;
  }
}
