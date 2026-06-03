/**
 * 个人主页：资料、统计、帖子、收藏、关注和粉丝
 */
import { store } from '../store.js';
import { userApi, postApi, interactApi } from '../api.js';
import { createPostCard, skeletonCard, showToast, emptyState, renderPagination } from '../components.js';

let activeTab = 'posts';
let currentPage = 1;
let pageContext = null;

export async function render(container, userId) {
  const requestedTab = sessionStorage.getItem('profileTab');
  sessionStorage.removeItem('profileTab');
  activeTab = requestedTab || 'posts';
  currentPage = 1;
  container.innerHTML = `
    <div class="page-section">
      <div class="skel-card" style="text-align:center;padding:var(--s10)">
        <div class="skeleton skel-avatar" style="width:80px;height:80px;margin:0 auto 16px"></div>
        <div class="skeleton skel-title" style="margin:0 auto 10px;width:180px"></div>
        <div class="skeleton skel-text" style="margin:0 auto;width:260px"></div>
      </div>
    </div>`;

  try {
    const currentUser = store.get('user');
    const profileId = userId || currentUser?.id;
    const user = profileId ? await userApi.getUserById(profileId) : currentUser;

    if (!user) {
      container.innerHTML = `<div class="page-section">${emptyState('&#128274;', '用户不存在', '', '返回首页', "$dispatch('nav','/')")}</div>`;
      return;
    }

    const isSelf = currentUser && Number(currentUser.id) === Number(user.id);
    if (activeTab === 'favorites' && !isSelf) activeTab = 'posts';
    renderShell(container, user, isSelf);
    setActiveTab(container);
    bindProfileEvents(container, user, isSelf);
    await loadTab(container, user, isSelf);
  } catch (err) {
    container.innerHTML = `<div class="page-section"><div class="state-container state-error"><div class="state-icon">&#9888;</div><div class="state-title">加载失败</div><div class="state-desc">${err.message}</div></div></div>`;
  }
}

function renderShell(container, user, isSelf) {
  container.innerHTML = `
    <div class="page-section">
      <div class="profile-header">
        <div class="profile-avatar">${renderAvatar(user)}</div>
        <div class="profile-name">${user.nickname || user.username || '未知用户'}</div>
        <div class="profile-bio">${user.bio || '这个人很低调，还没有写简介。'}</div>
        <div class="profile-stats">
          <button class="pstat" data-tab="posts"><div class="pstat-value">${user.postCount || 0}</div><div class="pstat-label">帖子</div></button>
          <button class="pstat" data-tab="posts"><div class="pstat-value">${user.likeCount || 0}</div><div class="pstat-label">获赞</div></button>
          <button class="pstat" data-tab="followees"><div class="pstat-value">${user.followeeCount || 0}</div><div class="pstat-label">关注</div></button>
          <button class="pstat" data-tab="followers"><div class="pstat-value" id="followerCount">${user.followerCount || 0}</div><div class="pstat-label">粉丝</div></button>
        </div>
        <div class="profile-actions">
          ${isSelf
            ? `<button class="btn btn-outline btn-sm" onclick="$dispatch('nav','/settings')">&#9998; 编辑资料</button>`
            : `<button class="btn ${user.followed ? 'btn-outline' : 'btn-primary'} btn-sm" id="followBtn">${user.followed ? '已关注' : '+ 关注'}</button>`
          }
        </div>
      </div>

      <div class="tabs profile-tabs" id="profileTabs">
        <button class="tab active" data-tab="posts">${isSelf ? '我的帖子' : 'TA 的帖子'}</button>
        ${isSelf ? `<button class="tab" data-tab="favorites">我的收藏</button>` : ''}
        <button class="tab" data-tab="followees">关注</button>
        <button class="tab" data-tab="followers">粉丝</button>
      </div>

      <div id="profileContent">${skeletonCard()}</div>
      <div id="profilePager"></div>
    </div>`;
}

function bindProfileEvents(container, user, isSelf) {
  pageContext = { container, user, isSelf };
  container.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', async () => {
      activeTab = btn.dataset.tab;
      currentPage = 1;
      setActiveTab(container);
      await loadTab(container, user, isSelf);
    });
  });

  const followBtn = container.querySelector('#followBtn');
  if (followBtn) {
    let followed = Boolean(user.followed);
    followBtn.addEventListener('click', async () => {
      try {
        followBtn.disabled = true;
        if (followed) {
          await userApi.unfollow(user.id);
          followed = false;
          user.followerCount = Math.max(0, (user.followerCount || 0) - 1);
          followBtn.textContent = '+ 关注';
          followBtn.className = 'btn btn-primary btn-sm';
          showToast('已取消关注', 'success');
        } else {
          await userApi.follow(user.id);
          followed = true;
          user.followerCount = (user.followerCount || 0) + 1;
          followBtn.textContent = '已关注';
          followBtn.className = 'btn btn-outline btn-sm';
          showToast('关注成功', 'success');
        }
        const followerCount = container.querySelector('#followerCount');
        if (followerCount) followerCount.textContent = user.followerCount || 0;
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        followBtn.disabled = false;
      }
    });
  }

  window.onprofilepage = async page => {
    if (!pageContext) return;
    currentPage = page;
    await loadTab(pageContext.container, pageContext.user, pageContext.isSelf);
  };
}

async function loadTab(container, user, isSelf) {
  const content = container.querySelector('#profileContent');
  const pager = container.querySelector('#profilePager');
  content.innerHTML = skeletonCard();
  pager.innerHTML = '';

  try {
    let data;
    if (activeTab === 'favorites') {
      data = await interactApi.getFavorites(currentPage, 10);
      renderPostList(content, data, '还没有收藏帖子');
    } else if (activeTab === 'followees') {
      data = await userApi.getFollowees(user.id, currentPage, 12);
      renderUserList(content, data, '还没有关注任何人');
    } else if (activeTab === 'followers') {
      data = await userApi.getFollowers(user.id, currentPage, 12);
      renderUserList(content, data, '还没有粉丝');
    } else {
      data = await postApi.getUserPosts(user.id, currentPage, 10);
      renderPostList(content, data, isSelf ? '你还没有发布帖子' : 'TA 还没有发布帖子');
    }
    renderPager(pager, data);
  } catch (e) {
    content.innerHTML = `<div class="state-container state-error"><div class="state-icon">&#9888;</div><div class="state-title">加载失败</div><div class="state-desc">${e.message}</div></div>`;
  }
}

function renderPostList(content, data, emptyText) {
  const records = getRecords(data);
  content.innerHTML = records.length
    ? records.map(p => createPostCard(p)).join('')
    : emptyState('&#128221;', emptyText, '内容发布后会显示在这里');
}

function renderUserList(content, data, emptyText) {
  const records = getRecords(data);
  content.innerHTML = records.length
    ? `<div class="user-grid">${records.map(renderUserCard).join('')}</div>`
    : emptyState('&#128100;', emptyText, '社区关系会显示在这里');
}

function renderUserCard(user) {
  return `
    <article class="user-card" onclick="$dispatch('nav','/profile/${user.id}')" tabindex="0">
      <div class="user-card-avatar">${renderAvatar(user)}</div>
      <div class="user-card-main">
        <div class="user-card-name">${user.nickname || user.username || '未知用户'}</div>
        <div class="user-card-bio">${user.bio || '暂无简介'}</div>
        <div class="user-card-meta">${user.postCount || 0} 帖子 · ${user.followerCount || 0} 粉丝</div>
      </div>
    </article>`;
}

function renderAvatar(user) {
  if (user.avatar) {
    return `<img src="${user.avatar}" alt="${user.nickname || user.username || '用户'}" onerror="this.remove()">`;
  }
  return (user.nickname || user.username || 'U').charAt(0).toUpperCase();
}

function getRecords(data) {
  return Array.isArray(data) ? data : (data?.records || data?.list || data?.content || []);
}

function renderPager(pager, data) {
  const totalPages = data?.pages || data?.totalPage || data?.totalPages || 1;
  pager.innerHTML = renderPagination(currentPage, totalPages, 'onprofilepage');
  pager.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const txt = btn.textContent.trim();
      if (txt === '«') window.onprofilepage(Math.max(1, currentPage - 1));
      else if (txt === '»') window.onprofilepage(Math.min(totalPages, currentPage + 1));
      else {
        const next = parseInt(txt, 10);
        if (!isNaN(next)) window.onprofilepage(next);
      }
    });
  });
}

function setActiveTab(container) {
  container.querySelectorAll('#profileTabs .tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === activeTab);
  });
}
