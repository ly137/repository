/**
 * 消息通知页
 */
import { store } from '../store.js';
import { notificationApi } from '../api.js';
import { showToast, emptyState } from '../components.js';

export async function render(container) {
  if (!store.get('isLoggedIn')) {
    container.innerHTML = `<div class="page-section"><div class="state-container state-empty"><div class="state-icon">&#128274;</div><div class="state-title">请先登录</div><a class="btn btn-primary" href="#/login">去登录</a></div></div>`;
    return;
  }

  container.innerHTML = `
    <div class="page-section">
      <div class="section-header">
        <div class="section-title">&#128276; 消息通知</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" id="markAllRead">全部已读</button>
        </div>
      </div>
      <div id="notifLoading">${emptyState('&#128276;', '', '加载中...')}</div>
      <div class="notif-list" id="notifList"></div>
    </div>`;

  await loadNotifs(container);

  container.querySelector('#markAllRead').addEventListener('click', async () => {
    try {
      await notificationApi.markAllRead();
      showToast('已全部标记为已读', 'success');
      store.set('unreadCount', 0);
      await loadNotifs(container);
    } catch (e) { showToast(e.message, 'error'); }
  });
}

async function loadNotifs(container) {
  const loading = container.querySelector('#notifLoading');
  const list = container.querySelector('#notifList');
  loading.style.display = 'block';
  list.innerHTML = '';

  try {
    const data = await notificationApi.getList(1, 50);
    const records = Array.isArray(data) ? data : (data?.records || data?.list || data?.content || []);
    loading.style.display = 'none';

    if (records.length === 0) {
      list.innerHTML = emptyState('&#128276;', '暂无通知', '当有人点赞、回复或关注你时，通知会出现在这里');
      return;
    }

    const typeMap = { 1: ['notif-like', '&#10084;'], 2: ['notif-reply', '&#128172;'], 3: ['notif-follow','&#128101;'], 4: ['notif-system','&#128276;'] };
    const targetMap = { 1: 'post', 2: 'post' };

    list.innerHTML = records.map(n => {
      const [cls, icon] = typeMap[n.type] || typeMap[4];
      const onClick = n.targetId && n.targetType
        ? `onclick="$dispatch('nav','/${targetMap[n.targetType] || 'post'}/${n.targetId}')"`
        : '';

      return `
        <div class="notif-item${n.isRead ? '' : ' unread'}" ${onClick}
             ${!n.isRead ? `data-nid="${n.id}"` : ''}>
          <div class="notif-icon ${cls}">${icon}</div>
          <div class="notif-body">
            <div class="notif-text"><b>${n.sender?.nickname || n.sender?.username || '系统'}</b> ${n.content || n.message || ''}</div>
            <div class="notif-time">${new Date(n.createdAt || n.createTime).toLocaleString('zh-CN')}</div>
          </div>
        </div>`;
    }).join('');

    // 标记已读
    list.querySelectorAll('.notif-item.unread').forEach(item => {
      item.addEventListener('click', async function() {
        const nid = this.dataset.nid;
        if (!nid) return;
        try {
          await notificationApi.markRead(nid);
          this.classList.remove('unread');
          const cur = store.get('unreadCount');
          store.set('unreadCount', Math.max(0, cur - 1));
        } catch (e) {}
      });
    });

  } catch (err) {
    loading.style.display = 'none';
    list.innerHTML = `<div class="state-container state-error"><div class="state-icon">&#9888;</div><div class="state-desc">${err.message}</div></div>`;
  }
}
