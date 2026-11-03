import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const loginGate = document.querySelector('#login-gate');
const protectedSite = document.querySelector('#protected-site');
const loginForm = document.querySelector('#login-form');
const authMessage = document.querySelector('#auth-message');
const themeButton = document.querySelector('#theme-button');
const logoutButton = document.querySelector('#logout-button');

function setTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  document.body.classList.toggle('light', !isDark);
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeButton.textContent = isDark ? '밝은 화면으로 보기' : '어두운 화면으로 보기';
}

function enterSite(email) {
  sessionStorage.setItem('memberEmail', email);
  loginGate.classList.add('hidden');
  protectedSite.classList.remove('hidden');
}

function leaveSite() {
  sessionStorage.removeItem('memberEmail');
  protectedSite.classList.add('hidden');
  loginGate.classList.remove('hidden');
  loginForm.reset();
  authMessage.textContent = '';
}

setTheme(false);
themeButton.addEventListener('click', () => setTheme(!document.body.classList.contains('dark')));
logoutButton.addEventListener('click', leaveSite);

const config = window.APP_CONFIG ?? {};
const isConfigured = config.supabaseUrl && config.supabaseAnonKey && !config.supabaseUrl.includes('YOUR_PROJECT');

if (!isConfigured) {
  authMessage.textContent = '웹사이트 설정이 완료되지 않았습니다.';
  loginForm.querySelector('button').disabled = true;
} else {
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

  async function isAllowed(email) {
    const { data, error } = await supabase.rpc('is_email_allowed', { requesting_email: email });
    if (error) throw error;
    return data === true;
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector('button');
    const email = String(new FormData(loginForm).get('email')).trim();
    button.disabled = true;
    authMessage.classList.remove('error');
    authMessage.textContent = '이메일을 확인하는 중입니다…';

    try {
      if (await isAllowed(email)) {
        authMessage.textContent = '';
        enterSite(email);
      } else {
        authMessage.textContent = '목록에 등록되지 않은 이메일입니다.';
        authMessage.classList.add('error');
      }
    } catch (error) {
      authMessage.textContent = `로그인할 수 없습니다: ${error.message}`;
      authMessage.classList.add('error');
    }
    button.disabled = false;
  });

  const savedEmail = sessionStorage.getItem('memberEmail');
  if (savedEmail) {
    try {
      if (await isAllowed(savedEmail)) enterSite(savedEmail);
      else leaveSite();
    } catch {
      leaveSite();
    }
  }
}
