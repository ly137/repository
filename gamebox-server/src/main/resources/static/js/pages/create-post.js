/**
 * 发帖页 — 创建/编辑帖子
 */
import { store } from '../store.js';
import { postApi, gameApi } from '../api.js';
import { showToast } from '../components.js';

export async function render(container) {
  const isLoggedIn = store.get('isLoggedIn');
  if (!isLoggedIn) {
    container.innerHTML = `<div class="page-section"><div class="state-container state-empty"><div class="state-icon">&#128274;</div><div class="state-title">请先登录</div><div class="state-desc">发布帖子需要登录账号</div><a class="btn btn-primary" href="#/login">去登录</a></div></div>`;
    return;
  }

  container.innerHTML = `
    <div class="page-section">
      <div class="section-header">
        <div class="section-title">&#9998; 发布帖子</div>
      </div>
      <div class="create-post">
        <div class="form-group">
          <label for="postTitle">标题 <span style="color:var(--danger)">*</span></label>
          <input type="text" id="postTitle" placeholder="请输入帖子标题（最多100字）" maxlength="100">
          <div class="char-count"><span id="titleCount">0</span>/100</div>
        </div>
        <div class="form-group">
          <label>分类 <span style="color:var(--danger)">*</span></label>
          <select id="postCategory">
            <option value="">请选择分类</option>
            <option value="攻略">攻略</option>
            <option value="讨论">讨论</option>
            <option value="求助">求助</option>
            <option value="分享">分享</option>
            <option value="新闻">新闻</option>
          </select>
        </div>
        <div class="form-group">
          <label for="postTags">标签（逗号分隔）</label>
          <input type="text" id="postTags" placeholder="如：艾尔登法环,攻略,DLC" maxlength="200">
        </div>
        <div class="form-group">
          <label for="postGameId">关联游戏（可选）</label>
          <input type="text" id="postGameSearch" placeholder="搜索游戏..." style="margin-bottom:8px" autocomplete="off">
          <select id="postGameId">
            <option value="">不关联游戏</option>
          </select>
          <div id="gameSearchResults" style="display:none;margin-top:4px;max-height:160px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r-md);background:var(--bg-card)"></div>
        </div>
        <div class="form-group">
          <label for="postContent">正文 <span style="color:var(--danger)">*</span></label>
          <textarea id="postContent" rows="10" placeholder="写下你想分享的内容..." maxlength="10000"></textarea>
          <div class="char-count"><span id="contentCount">0</span>/10000</div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" id="submitPostBtn">发布帖子</button>
          <button class="btn btn-outline" onclick="$dispatch('nav','/community')">取消</button>
        </div>
      </div>
    </div>`;

  // 字数统计
  container.querySelector('#postTitle').addEventListener('input', function() {
    container.querySelector('#titleCount').textContent = this.value.length;
  });
  container.querySelector('#postContent').addEventListener('input', function() {
    container.querySelector('#contentCount').textContent = this.value.length;
  });

  // 游戏搜索
  let searchTimer;
  container.querySelector('#postGameSearch').addEventListener('input', function() {
    clearTimeout(searchTimer);
    const kw = this.value.trim();
    if (!kw) { container.querySelector('#gameSearchResults').style.display = 'none'; return; }
    searchTimer = setTimeout(async () => {
      try {
        const data = await gameApi.search(kw, 1, 5);
        const games = Array.isArray(data) ? data : (data?.records || data?.list || []);
        const rs = container.querySelector('#gameSearchResults');
        rs.innerHTML = games.map(g => `<div style="padding:8px 12px;cursor:pointer;font-size:13px" onmousedown="event.preventDefault();document.getElementById('postGameId').value='${g.id}';document.getElementById('postGameSearch').value='${g.name}';this.parentElement.style.display='none'">${g.name} - ${g.developer||''}</div>`).join('');
        rs.style.display = games.length ? 'block' : 'none';
      } catch(e) {}
    }, 300);
  });

  // 发布
  container.querySelector('#submitPostBtn').addEventListener('click', async () => {
    const title = container.querySelector('#postTitle').value.trim();
    const category = container.querySelector('#postCategory').value;
    const tags = container.querySelector('#postTags').value;
    const gameId = container.querySelector('#postGameId').value;
    const content = container.querySelector('#postContent').value.trim();

    if (!title) { showToast('请输入标题', 'error'); return; }
    if (!category) { showToast('请选择分类', 'error'); return; }
    if (!content) { showToast('请输入正文内容', 'error'); return; }

    const btn = container.querySelector('#submitPostBtn');
    btn.disabled = true;
    btn.textContent = '发布中...';

    try {
      const data = {
        title, category, content,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean).join(',') : '',
        gameId: gameId || null,
      };
      const result = await postApi.create(data);
      showToast('发布成功！', 'success');
      setTimeout(() => window.$dispatch('nav', `/post/${result.id || result}`), 500);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = '发布帖子';
    }
  });
}
