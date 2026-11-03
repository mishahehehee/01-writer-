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

  async function renderSession(session) {
    const isSignedIn = Boolean(session);
    authPanel.classList.toggle('hidden', isSignedIn);
    directoryPanel.classList.toggle('hidden', !isSignedIn);
    logoutButton.classList.toggle('hidden', !isSignedIn);
    if (!session) return;

    signedInAs.textContent = `${session.user.email} 계정으로 로그인했습니다.`;
    memberList.innerHTML = '<p class="status">목록을 불러오는 중입니다…</p>';
    const { data, error } = await supabase.from('members').select('id, name, email').order('id');

    if (error) {
      memberList.innerHTML = `<p class="status error">목록을 불러오지 못했습니다: ${escapeHtml(error.message)}</p>`;
      return;
    }

    memberList.innerHTML = data.map((member, index) => `
      <article class="member-card">
        <span>MEMBER ${String(index + 1).padStart(2, '0')}</span>
        <h3>${escapeHtml(member.name)}</h3>
        <a href="mailto:${encodeURIComponent(member.email)}">${escapeHtml(member.email)}</a>
      </article>
    `).join('');
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector('button');
    const email = String(new FormData(loginForm).get('email')).trim();
    button.disabled = true;
    authMessage.textContent = '로그인 링크를 보내는 중입니다…';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href.split('#')[0] }
    });
    authMessage.textContent = error ? `로그인 링크를 보내지 못했습니다: ${error.message}` : '이메일을 확인해 로그인 링크를 눌러 주세요.';
    authMessage.classList.toggle('error', Boolean(error));
    button.disabled = false;
  });

  logoutButton.addEventListener('click', () => supabase.auth.signOut());
  supabase.auth.onAuthStateChange((_event, session) => { void renderSession(session); });
  const { data: { session } } = await supabase.auth.getSession();
  await renderSession(session);
}
