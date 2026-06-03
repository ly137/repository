/**
 * 登录 / 注册页
 */
import { store } from '../store.js';
import { userApi } from '../api.js';
import { showToast } from '../components.js';

export async function renderLogin(container) {
  container.innerHTML = `
    <div class="page-section">
      <div class="auth-page">
        <div class="auth-card">
          <h1 class="auth-title">&#127918; GameBox</h1>
          <p class="auth-subtitle">登录你的游戏社区账号</p>
          <form class="auth-form" id="loginForm">
            <div class="form-group">
              <label for="loginUsername">用户名</label>
              <input type="text" id="loginUsername" placeholder="请输入用户名" required autocomplete="username">
            </div>
            <div class="form-group">
              <label for="loginPassword">密码</label>
              <input type="password" id="loginPassword" placeholder="请输入密码" required autocomplete="current-password">
            </div>
            <div id="loginError" class="form-error" style="margin-bottom:8px"></div>
            <button type="submit" class="btn btn-primary" id="loginSubmitBtn">登录</button>
          </form>
          <div class="auth-switch">还没有账号？<a href="#/register">立即注册</a></div>
        </div>
      </div>
    </div>`;

  container.querySelector('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = container.querySelector('#loginUsername').value.trim();
    const password = container.querySelector('#loginPassword').value;
    const btn = container.querySelector('#loginSubmitBtn');
    const errEl = container.querySelector('#loginError');

    if (!username || !password) { errEl.textContent = '请输入用户名和密码'; return; }
    errEl.textContent = '';
    btn.disabled = true;
    btn.innerHTML = '登录中...';

    try {
      const result = await userApi.login({ username, password });
      // 后端返回 { token, user } 或直接是 token+user
      const token = result.token;
      const user = result.user || result;
      store.login(token, user);
      showToast('登录成功！欢迎回来', 'success');
      setTimeout(() => window.$dispatch('nav', '/'), 500);
    } catch (err) {
      errEl.textContent = err.message;
      btn.disabled = false;
      btn.innerHTML = '登录';
    }
  });
}

export async function renderRegister(container) {
  container.innerHTML = `
    <div class="page-section">
      <div class="auth-page">
        <div class="auth-card">
          <h1 class="auth-title">&#127918; GameBox</h1>
          <p class="auth-subtitle">创建你的游戏社区账号</p>
          <form class="auth-form" id="registerForm">
            <div class="form-group">
              <label for="regUsername">用户名 <span style="color:var(--danger)">*</span></label>
              <input type="text" id="regUsername" placeholder="2-20个字符" required minlength="2" maxlength="20" autocomplete="username">
            </div>
            <div class="form-group">
              <label for="regNickname">昵称</label>
              <input type="text" id="regNickname" placeholder="给自己取个好听的名字" maxlength="20">
            </div>
            <div class="form-group">
              <label for="regPassword">密码 <span style="color:var(--danger)">*</span></label>
              <input type="password" id="regPassword" placeholder="至少6位" required minlength="6" autocomplete="new-password">
            </div>
            <div class="form-group">
              <label for="regPassword2">确认密码 <span style="color:var(--danger)">*</span></label>
              <input type="password" id="regPassword2" placeholder="再次输入密码" required minlength="6" autocomplete="new-password">
            </div>
            <div id="regError" class="form-error" style="margin-bottom:8px"></div>
            <button type="submit" class="btn btn-primary" id="regSubmitBtn">注册</button>
          </form>
          <div class="auth-switch">已有账号？<a href="#/login">立即登录</a></div>
        </div>
      </div>
    </div>`;

  container.querySelector('#registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = container.querySelector('#regUsername').value.trim();
    const nickname = container.querySelector('#regNickname').value.trim();
    const password = container.querySelector('#regPassword').value;
    const password2 = container.querySelector('#regPassword2').value;
    const btn = container.querySelector('#regSubmitBtn');
    const errEl = container.querySelector('#regError');

    errEl.textContent = '';
    if (username.length < 2) { errEl.textContent = '用户名至少2个字符'; return; }
    if (password.length < 6) { errEl.textContent = '密码至少6位'; return; }
    if (password !== password2) { errEl.textContent = '两次密码不一致'; return; }

    btn.disabled = true;
    btn.innerHTML = '注册中...';

    try {
      const result = await userApi.register({ username, nickname: nickname || username, password });
      showToast('注册成功！', 'success');
      setTimeout(() => window.$dispatch('nav', '/login'), 500);
    } catch (err) {
      errEl.textContent = err.message;
      btn.disabled = false;
      btn.innerHTML = '注册';
    }
  });
}
