const themeButton = document.querySelector('#theme-button');
function setTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  document.body.classList.toggle('light', !isDark);
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeButton.textContent = isDark ? '밝은 화면으로 보기' : '어두운 화면으로 보기';
}
// 원본 디자인의 기본 테마
setTheme(false);
themeButton.addEventListener('click', () => {
  setTheme(!document.body.classList.contains('dark'));
});
