import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const themeButton = document.querySelector('#theme-button');
const logoutButton = document.querySelector('#logout-button');
const loginForm = document.querySelector('#login-form');
const authPanel = document.querySelector('#auth-panel');
const directoryPanel = document.querySelector('#directory-panel');
const authMessage = document.querySelector('#auth-message');
const signedInAs = document.querySelector('#signed-in-as');
const memberList = document.querySelector('#member-list');

function setTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  document.body.classList.toggle('light', !isDark);
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeButton.textContent = isDark ? '밝은 화면으로 보기' : '어두운 화면으로 보기';
}

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = value;
  return element.innerHTML;
}

setTheme(false);
themeButton.addEventListener('click', () => setTheme(!document.body.classList.contains('dark')));

const config = window.APP_CONFIG ?? {};
const isConfigured = config.supabaseUrl && config.supabaseAnonKey && !config.supabaseUrl.includes('YOUR_PROJECT');

if (!isConfigured) {
  authMessage.textContent = 'Supabase 설정이 필요합니다. config.example.js를 참고해 config.js를 만들어 주세요.';
  loginForm.querySelector('button').disabled = true;
} else {
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

  function showDirectory(email, members) {
    authPanel.classList.add('hidden');
    directoryPanel.classList.remove('hidden');
    logoutButton.classList.remove('hidden');
    signedInAs.textContent = `${email} 이메일로 로그인했습니다.`;
    memberList.innerHTML = members.map((member, index) => `
      <article class="member-card">
        <span>MEMBER ${String(index + 1).padStart(2, '0')}</span>
        <h3>${escapeHtml(member.name)}</h3>
        <a href="mailto:${encodeURIComponent(member.email)}">${escapeHtml(member.email)}</a>
      </article>
    `).join('');
  }

  function showLogin() {
    sessionStorage.removeItem('memberEmail');
    authPanel.classList.remove('hidden');
    directoryPanel.classList.add('hidden');
    logoutButton.classList.add('hidden');
    memberList.innerHTML = '';
  }

  async function loginWithEmail(email) {
    const { data, error } = await supabase.rpc('get_members_for_email', { requesting_email: email });

    if (error) {
      throw error;
    }
    if (!data.length) throw new Error('목록에 등록되지 않은 이메일입니다.');
    sessionStorage.setItem('memberEmail', email);
    showDirectory(email, data);
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector('button');
    const email = String(new FormData(loginForm).get('email')).trim();
    button.disabled = true;
    authMessage.textContent = '이메일을 확인하는 중입니다…';
    try {
      await loginWithEmail(email);
      authMessage.textContent = '';
    } catch (error) {
      authMessage.textContent = error.message;
      authMessage.classList.add('error');
    }
    button.disabled = false;
  });

  logoutButton.addEventListener('click', showLogin);
  const savedEmail = sessionStorage.getItem('memberEmail');
  if (savedEmail) {
    try { await loginWithEmail(savedEmail); } catch { showLogin(); }
  }
}
