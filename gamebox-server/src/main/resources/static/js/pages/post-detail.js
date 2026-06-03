/**
 * 帖子详情页 + 回复
 */
import { store } from '../store.js';
import { postApi, interactApi } from '../api.js';
import { showToast, emptyState } from '../components.js';

export async function render(container, postId) {
  container.innerHTML = `<div class="page-section"><div class="post-detail"><div class="skeleton skel-title"></div><div class="skeleton skel-text"></div><div class="skeleton skel-text"></div></div></div>`;

  try {
    const post = await postApi.getById(postId);
    const user = store.get('user');
    const isOwner = user && (user.id === post.userId || user.id === post.author?.id);

    container.querySelector('.page-section').innerHTML = `
      <div class="post-detail">
        <h1 class="pd-title">${post.title || '无标题'}</h1>
        <div class="pd-meta">
          <div class="pc-avatar">${(post.author?.nickname || post.author?.username || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <div class="pc-username">${post.author?.nickname || post.author?.username || '匿名用户'}</div>
            <div class="pc-time">发布时间：${new Date(post.createdAt || post.createTime).toLocaleString('zh-CN')}</div>
          </div>
          ${post.category ? `<span class="pc-category cat-${post.category === '攻略' ? 'guide' : post.category === '讨论' ? 'discuss' : post.category === '求助' ? 'help' : post.category === '分享' ? 'share' : 'news'}">${post.category}</span>` : ''}
          <div style="margin-left:auto;display:flex;gap:8px">
            ${isOwner ? `<button class="btn btn-outline btn-sm" onclick="$dispatch('nav','/create?edit=${post.id}')">编辑</button>
                         <button class="btn btn-danger btn-sm" onclick="$dispatch('deletePost',${post.id})">删除</button>` : ''}
          </div>
        </div>
        ${post.coverImage || post.cover ? `<div class="pc-cover" style="margin-bottom:16px;height:auto;max-height:400px"><img src="${post.coverImage || post.cover}" alt="封面" onerror="this.parentElement.style.display='none'" style="max-height:400px;object-fit:contain"></div>` : ''}
        <div class="pd-content">${post.content || '（暂无正文）'}</div>
        ${post.tags ? `<div class="pc-tags">${(Array.isArray(post.tags) ? post.tags : post.tags.split(',')).map(t => `<span class="pc-tag">#${t.trim()}</span>`).join('')}</div>` : ''}
        <div class="pd-actions">
          <div class="pc-stat${post.liked ? ' liked' : ''}" id="postLikeBtn" data-id="${post.id}" style="font-size:14px">
            <span class="stat-icon">${post.liked ? '&#10084;' : '&#9825;'}</span> 点赞 ${post.likeCount || 0}
          </div>
          <div class="pc-stat" style="font-size:14px">&#128172; 回复 ${post.replyCount || 0}</div>
          <div class="pc-stat" style="font-size:14px">&#128065; ${post.viewCount || 0} 次浏览</div>
        </div>
      </div>
      <div class="reply-section">
        <div class="reply-title">评论 (${post.replyCount || 0})</div>
        ${store.get('isLoggedIn') ? `
          <div class="reply-form">
            <textarea id="replyInput" placeholder="写下你的评论..." maxlength="500"></textarea>
            <button class="btn btn-primary" id="replySubmitBtn">发送</button>
          </div>
        ` : `<div style="margin-bottom:16px;font-size:var(--t-sm);color:var(--text-muted)"><a href="#/login" style="color:var(--brand)">登录</a>后参与评论</div>`}
        <div class="reply-list" id="replyList">${emptyState('&#128172;', '', '加载评论中...')}</div>
        <div id="replyPagination"></div>
      </div>`;

    // 点赞
    container.querySelector('#postLikeBtn')?.addEventListener('click', async function() {
      if (!store.get('isLoggedIn')) { showToast('请先登录', 'error'); return; }
      try {
        if (post.liked) {
          await interactApi.unlike(1, post.id);
          post.liked = false;
          post.likeCount = Math.max(0, (post.likeCount || 1) - 1);
        } else {
          await interactApi.like(1, post.id);
          post.liked = true;
          post.likeCount = (post.likeCount || 0) + 1;
        }
        this.classList.toggle('liked', post.liked);
        this.querySelector('.stat-icon').innerHTML = post.liked ? '&#10084;' : '&#9825;';
        this.childNodes[1].textContent = ' 点赞 ' + post.likeCount;
        showToast(post.liked ? '已点赞' : '已取消点赞', 'success');
      } catch (e) { showToast(e.message, 'error'); }
    });

    // 发送回复
    container.querySelector('#replySubmitBtn')?.addEventListener('click', () => sendReply(container, postId));

    // 加载回复
    await loadReplies(container, postId);

    // 删除帖子
    window.addEventListener('deletePost', async function handler(e) {
      if (e.detail !== postId) return;
      window.removeEventListener('deletePost', handler);
      if (!confirm('确定删除这篇帖子吗？此操作不可撤销。')) return;
      try {
        await postApi.remove(postId);
        showToast('帖子已删除', 'success');
        window.$dispatch('nav', '/community');
      } catch (err) { showToast(err.message, 'error'); }
    });

  } catch (err) {
    container.querySelector('.page-section').innerHTML = `<div class="state-container state-error"><div class="state-icon">&#9888;</div><div class="state-title">加载失败</div><div class="state-desc">${err.message}</div></div>`;
  }
}

async function sendReply(container, postId) {
  const input = container.querySelector('#replyInput');
  const content = input.value.trim();
  if (!content) { showToast('请输入评论内容', 'error'); return; }
  try {
    await interactApi.reply({ postId, content });
    input.value = '';
    showToast('评论成功', 'success');
    await loadReplies(container, postId);
  } catch (err) { showToast(err.message, 'error'); }
}

let replyPage = 1;
async function loadReplies(container, postId) {
  const list = container.querySelector('#replyList');
  const pag = container.querySelector('#replyPagination');
  try {
    const data = await interactApi.getReplies(postId, replyPage, 20);
    const records = Array.isArray(data) ? data : (data?.records || data?.list || data?.content || []);
    if (records.length === 0) {
      list.innerHTML = emptyState('&#128172;', '', '暂无评论，来发表第一条评论吧');
      return;
    }
    list.innerHTML = records.map(r => `
      <div class="reply-item">
        <div class="ri-header">
          <div class="ri-avatar">${(r.user?.nickname || r.user?.username || r.author?.nickname || r.author?.username || 'U').charAt(0).toUpperCase()}</div>
          <span class="ri-user">${r.user?.nickname || r.user?.username || r.author?.nickname || r.author?.username || '匿名用户'}</span>
          <span class="ri-time">${new Date(r.createdAt || r.createTime).toLocaleString('zh-CN')}</span>
        </div>
        <div class="ri-content">${r.content || ''}</div>
      </div>`).join('');
  } catch (err) {
    list.innerHTML = `<div class="state-container state-error"><div class="state-desc">加载评论失败</div></div>`;
  }
}
