/**
 * 帮助中心：项目说明、个人标识和联系方式
 */
export async function render(container) {
  container.innerHTML = `
    <div class="page-section">
      <div class="help-hero">
        <div>
          <div class="help-kicker">GameBox Help</div>
          <h1 class="help-title">帮助中心</h1>
          <p class="help-subtitle">这里整理了常用入口、联系邮箱和个人标识，方便在项目展示或答辩时快速说明。</p>
        </div>
        <button class="btn btn-primary" onclick="$dispatch('nav','/community')">&#128221; 去社区看看</button>
      </div>

      <div class="help-grid">
        <section class="help-panel help-profile-panel">
          <div class="help-panel-title">个人标识</div>
          <div class="identity-badges">
            <span>lingyun</span>
            <span>GameBox Creator</span>
            <span>2025250387</span>
            <span>fjc</span>
          </div>
          <p class="help-text">这些标识可用于页面署名、项目说明、个人介绍或后续账号资料展示。</p>
        </section>

        <section class="help-panel">
          <div class="help-panel-title">联系方式</div>
          <a class="contact-row" href="mailto:2252338560@qq.com">
            <span class="contact-icon">&#9993;</span>
            <div>
              <strong>QQ 邮箱</strong>
              <small>2252338560@qq.com</small>
            </div>
          </a>
          <a class="contact-row" href="mailto:yun47259@gmail.com">
            <span class="contact-icon">&#9993;</span>
            <div>
              <strong>Gmail</strong>
              <small>yun47259@gmail.com</small>
            </div>
          </a>
        </section>

        <section class="help-panel">
          <div class="help-panel-title">常用功能</div>
          <div class="quick-actions">
            <button onclick="$dispatch('nav','/profile/'+(JSON.parse(localStorage.getItem('user')||'{}').id||''))">个人主页</button>
            <button onclick="$dispatch('nav','/settings')">个人设置</button>
            <button onclick="sessionStorage.setItem('profileTab','favorites');$dispatch('nav','/profile/'+(JSON.parse(localStorage.getItem('user')||'{}').id||''))">我的收藏</button>
            <button onclick="$dispatch('nav','/notifications')">消息通知</button>
          </div>
        </section>

        <section class="help-panel">
          <div class="help-panel-title">使用提示</div>
          <ul class="help-list">
            <li>点击右上角头像可以打开用户菜单。</li>
            <li>个人设置里可以维护昵称、简介、邮箱和头像链接。</li>
            <li>个人主页的关注、粉丝、收藏都可以从菜单快速进入。</li>
            <li>如果页面没有更新，优先使用 Ctrl + F5 强制刷新。</li>
          </ul>
        </section>
      </div>
    </div>`;
}
