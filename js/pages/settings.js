/**
 * 个人设置页
 */
import { store } from '../store.js';
import { userApi } from '../api.js';
import { showToast } from '../components.js';

export async function render(container) {
  if (!store.get('isLoggedIn')) {
    container.innerHTML = `<div class="page-section"><div class="state-container state-empty"><div class="state-icon">&#128274;</div><div class="state-title">请先登录</div><a class="btn btn-primary" href="#/login">去登录</a></div></div>`;
    return;
  }

  const user = store.get('user');

  container.innerHTML = `
    <div class="page-section">
      <div class="section-header"><div class="section-title">&#9881; 个人设置</div></div>
      <div class="settings-page">
        <div class="settings-card">
          <div class="widget-header" style="margin-bottom:16px">基本信息</div>
          <form id="profileForm">
            <div class="settings-avatar-preview">
              <div class="profile-avatar">${user.avatar ? `<img src="${user.avatar}" alt="${user.nickname || user.username || '用户'}" onerror="this.remove()">` : (user.nickname || user.username || 'U').charAt(0).toUpperCase()}</div>
              <div>
                <div class="settings-avatar-title">${user.nickname || user.username || '我的头像'}</div>
                <div class="settings-avatar-desc">支持填写图片链接，留空则使用昵称首字母头像</div>
              </div>
            </div>
            <div class="form-group">
              <label>用户名</label>
              <input type="text" value="${user.username || ''}" disabled style="background:var(--border-light);cursor:not-allowed">
            </div>
            <div class="form-group">
              <label for="setAvatar">头像链接</label>
              <input type="url" id="setAvatar" value="${user.avatar || ''}" placeholder="https://example.com/avatar.png">
            </div>
            <div class="form-group">
              <label for="setNickname">昵称</label>
              <input type="text" id="setNickname" value="${user.nickname || ''}" maxlength="20">
            </div>
            <div class="form-group">
              <label for="setBio">个人简介</label>
              <textarea id="setBio" rows="3" maxlength="200" placeholder="介绍一下自己...">${user.bio || ''}</textarea>
            </div>
            <div class="form-group">
              <label for="setEmail">邮箱</label>
              <input type="email" id="setEmail" value="${user.email || ''}" placeholder="用于找回密码">
            </div>
            <div id="profileError" class="form-error"></div>
            <button type="submit" class="btn btn-primary" id="saveProfileBtn">保存修改</button>
          </form>
        </div>

        <div class="settings-card">
          <div class="widget-header" style="margin-bottom:16px">修改密码</div>
          <form id="passwordForm">
            <div class="form-group">
              <label for="oldPwd">原密码</label>
              <input type="password" id="oldPwd" placeholder="请输入原密码" required autocomplete="current-password">
            </div>
            <div class="form-group">
              <label for="newPwd">新密码</label>
              <input type="password" id="newPwd" placeholder="至少6位" required minlength="6" autocomplete="new-password">
            </div>
            <div class="form-group">
              <label for="newPwd2">确认新密码</label>
              <input type="password" id="newPwd2" placeholder="再次输入新密码" required minlength="6">
            </div>
            <div id="pwdError" class="form-error"></div>
            <button type="submit" class="btn btn-outline" id="savePwdBtn">修改密码</button>
          </form>
        </div>

        <div style="text-align:center;padding:20px 0">
          <button class="btn btn-ghost" onclick="$dispatch('logout')" style="color:var(--danger)">退出登录</button>
        </div>
      </div>
    </div>`;

  // 保存资料
  container.querySelector('#profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const nickname = container.querySelector('#setNickname').value.trim();
    const avatar = container.querySelector('#setAvatar').value.trim();
    const bio = container.querySelector('#setBio').value.trim();
    const email = container.querySelector('#setEmail').value.trim();
    const errEl = container.querySelector('#profileError');
    errEl.textContent = '';

    try {
      const updated = await userApi.updateProfile({ nickname, avatar, bio, email });
      store.set('user', { ...user, ...updated, nickname: nickname || user.nickname, avatar, bio, email });
      showToast('资料已更新', 'success');
    } catch (err) {
      errEl.textContent = err.message;
    }
  });

  // 修改密码
  container.querySelector('#passwordForm').addEventListener('submit', async e => {
    e.preventDefault();
    const oldPwd = container.querySelector('#oldPwd').value;
    const newPwd = container.querySelector('#newPwd').value;
    const newPwd2 = container.querySelector('#newPwd2').value;
    const errEl = container.querySelector('#pwdError');
    errEl.textContent = '';

    if (newPwd !== newPwd2) { errEl.textContent = '两次新密码不一致'; return; }
    if (newPwd.length < 6) { errEl.textContent = '新密码至少6位'; return; }

    try {
      await userApi.changePassword({ oldPassword: oldPwd, newPassword: newPwd });
      showToast('密码已修改', 'success');
      container.querySelector('#passwordForm').reset();
    } catch (err) {
      errEl.textContent = err.message;
    }
  });
}
