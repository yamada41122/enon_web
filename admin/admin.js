/* =========================================================
   enon admin - CRUD editor for content.json
   ========================================================= */

const DRAFT_KEY = 'enonSiteDraft';
const DATA_URL = '../data/content.json';

const COLOR_OPTIONS = [
  { var:'--c-honoka', en:'WHITE',   jp:'ホワイト' },
  { var:'--c-mori',   en:'GREEN',   jp:'グリーン' },
  { var:'--c-fuwari', en:'SKYBLUE', jp:'水色'     },
  { var:'--c-yuna',   en:'PINK',    jp:'ピンク'   },
  { var:'--c-rin',    en:'YELLOW',  jp:'イエロー' }
];
const NEWS_CATEGORIES = ['live','media','info','goods'];
const GALLERY_COLORS  = ['c1','c2','c3','c4','c5','c6','c7','c8'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const WEEKDAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const CTA_TYPES = [{v:'',l:'通常'},{v:'debut',l:'Debut強調'}];

let state = null;  // the editable content

// ---------- utilities ----------
function setStatus(msg, kind='') {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'a-status' + (kind ? ' ' + kind : '');
}
function save() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
}
function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
async function fetchSiteContent() {
  const res = await fetch(DATA_URL, { cache:'no-cache' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return await res.json();
}

function download(filename, text) {
  const blob = new Blob([text], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

// ---------- rendering ----------
function renderAll() {
  renderGroup();
  renderMembers();
  renderNews();
  renderSchedule();
  renderGallery();
  renderSns();
}

// GROUP
function renderGroup() {
  document.querySelectorAll('[data-group]').forEach(inp => {
    const key = inp.dataset.group;
    inp.value = state.group?.[key] ?? '';
    inp.oninput = () => { state.group[key] = inp.value; save(); };
  });
}

// MEMBERS
function renderMembers() {
  const list = document.getElementById('memberList');
  if (!state.members?.length) {
    list.innerHTML = '<div class="a-empty">メンバー未登録</div>';
    return;
  }
  list.innerHTML = state.members.map((m,i) => memberCardHTML(m,i)).join('');
  bindListHandlers('members');
}

function memberCardHTML(m, i) {
  const colorOpts = COLOR_OPTIONS.map(c => `<option value="${c.var}" ${m.colorVar===c.var?'selected':''}>${c.en} / ${c.jp}</option>`).join('');
  return `
  <div class="a-card" data-index="${i}">
    <div class="a-card__head">
      <div class="a-card__label">No. ${esc(m.no||'')} / ${esc(m.nameEn||'')} (${esc(m.nameJpFamily||'')} ${esc(m.nameJpGiven||'')})</div>
      <div class="a-card__actions">
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="up">▲</button>
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="down">▼</button>
        <button class="a-btn a-btn--danger a-btn--sm" data-action="del">削除</button>
      </div>
    </div>
    <div class="a-card__grid a-card__grid--3">
      <label class="a-card__field"><span>ID</span><input data-k="id" value="${esc(m.id||'')}"></label>
      <label class="a-card__field"><span>No.</span><input data-k="no" value="${esc(m.no||'')}"></label>
      <label class="a-card__field"><span>イニシャル</span><input data-k="initial" value="${esc(m.initial||'')}" maxlength="2"></label>
      <label class="a-card__field"><span>担当カラー</span>
        <select data-k="colorVar">${colorOpts}</select>
      </label>
      <label class="a-card__field"><span>カラー(英)</span><input data-k="colorEn" value="${esc(m.colorEn||'')}"></label>
      <label class="a-card__field"><span>カラー(和)</span><input data-k="colorJp" value="${esc(m.colorJp||'')}"></label>
      <label class="a-card__field"><span>名前(英)</span><input data-k="nameEn" value="${esc(m.nameEn||'')}"></label>
      <label class="a-card__field"><span>苗字(漢字)</span><input data-k="nameJpFamily" value="${esc(m.nameJpFamily||'')}"></label>
      <label class="a-card__field"><span>名前(漢字/かな)</span><input data-k="nameJpGiven" value="${esc(m.nameJpGiven||'')}"></label>
      <label class="a-card__field"><span>ふりがな</span><input data-k="reading" value="${esc(m.reading||'')}"></label>
      <label class="a-card__field"><span>ポジション</span><input data-k="position" value="${esc(m.position||'')}"></label>
      <label class="a-card__field"><span>誕生日</span><input data-k="birth" value="${esc(m.birth||'')}"></label>
      <label class="a-card__field a-card__field--wide"><span>キャッチコピー</span><input data-k="catch" value="${esc(m.catch||'')}"></label>
      <label class="a-card__field a-card__field--wide"><span>自己紹介文</span><textarea data-k="bio">${esc(m.bio||'')}</textarea></label>
      <label class="a-card__field a-card__field--wide"><span>趣味</span><input data-k="hobby" value="${esc(m.hobby||'')}"></label>
      <label class="a-card__field a-card__field--wide"><span>好きなもの</span><input data-k="likes" value="${esc(m.likes||'')}"></label>
    </div>
  </div>`;
}

// NEWS
function renderNews() {
  const list = document.getElementById('newsList');
  if (!state.news?.length) { list.innerHTML = '<div class="a-empty">ニュース未登録</div>'; return; }
  list.innerHTML = state.news.map((n,i) => newsCardHTML(n,i)).join('');
  bindListHandlers('news');
}

function newsCardHTML(n,i) {
  const catOpts = NEWS_CATEGORIES.map(c => `<option value="${c}" ${n.category===c?'selected':''}>${c.toUpperCase()}</option>`).join('');
  return `
  <div class="a-card" data-index="${i}">
    <div class="a-card__head">
      <div class="a-card__label">
        <span class="a-card__badge ${esc(n.category||'')}">${esc((n.category||'').toUpperCase())}</span>
        &nbsp;${esc(n.date||'')} - ${esc((n.title||'').slice(0,40))}
      </div>
      <div class="a-card__actions">
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="up">▲</button>
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="down">▼</button>
        <button class="a-btn a-btn--danger a-btn--sm" data-action="del">削除</button>
      </div>
    </div>
    <div class="a-card__grid a-card__grid--4">
      <label class="a-card__field"><span>日付 (YYYY.MM.DD)</span><input data-k="date" value="${esc(n.date||'')}"></label>
      <label class="a-card__field"><span>カテゴリ</span><select data-k="category">${catOpts}</select></label>
      <label class="a-card__field a-card__field--wide"><span>タイトル</span><input data-k="title" value="${esc(n.title||'')}"></label>
      <label class="a-card__field a-card__field--wide"><span>リンクURL（空欄可）</span><input data-k="url" value="${esc(n.url||'#')}"></label>
    </div>
  </div>`;
}

// SCHEDULE
function renderSchedule() {
  const list = document.getElementById('scheduleList');
  if (!state.schedule?.length) { list.innerHTML = '<div class="a-empty">スケジュール未登録</div>'; return; }
  list.innerHTML = state.schedule.map((s,i) => scheduleCardHTML(s,i)).join('');
  bindListHandlers('schedule');
}

function scheduleCardHTML(s,i) {
  const monOpts = MONTHS.map(m => `<option ${s.month===m?'selected':''}>${m}</option>`).join('');
  const wOpts = WEEKDAYS.map(w => `<option ${s.weekday===w?'selected':''}>${w}</option>`).join('');
  const ctaOpts = CTA_TYPES.map(c => `<option value="${c.v}" ${s.ctaType===c.v?'selected':''}>${c.l}</option>`).join('');
  return `
  <div class="a-card" data-index="${i}">
    <div class="a-card__head">
      <div class="a-card__label">${esc(s.year||'')} / ${esc(s.month||'')}.${esc(s.day||'')} - ${esc((s.title||'').slice(0,40))}</div>
      <div class="a-card__actions">
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="up">▲</button>
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="down">▼</button>
        <button class="a-btn a-btn--danger a-btn--sm" data-action="del">削除</button>
      </div>
    </div>
    <div class="a-card__grid a-card__grid--4">
      <label class="a-card__field"><span>年</span><input data-k="year" value="${esc(s.year||'')}"></label>
      <label class="a-card__field"><span>月</span><select data-k="month">${monOpts}</select></label>
      <label class="a-card__field"><span>日</span><input data-k="day" value="${esc(s.day||'')}" maxlength="2"></label>
      <label class="a-card__field"><span>曜日</span><select data-k="weekday">${wOpts}</select></label>
      <label class="a-card__field a-card__field--wide"><span>タイトル</span><input data-k="title" value="${esc(s.title||'')}"></label>
      <label class="a-card__field a-card__field--wide"><span>会場・補足情報</span><input data-k="meta" value="${esc(s.meta||'')}"></label>
      <label class="a-card__field"><span>ボタン種別</span><select data-k="ctaType">${ctaOpts}</select></label>
      <label class="a-card__field"><span>ボタンラベル</span><input data-k="ctaLabel" value="${esc(s.ctaLabel||'Info')}"></label>
      <label class="a-card__field a-card__field--wide"><span>リンクURL</span><input data-k="url" value="${esc(s.url||'#')}"></label>
    </div>
  </div>`;
}

// GALLERY
function renderGallery() {
  const list = document.getElementById('galleryList');
  if (!state.gallery?.length) { list.innerHTML = '<div class="a-empty">ギャラリー未登録</div>'; return; }
  list.innerHTML = state.gallery.map((g,i) => galleryCardHTML(g,i)).join('');
  bindListHandlers('gallery');
}

function galleryCardHTML(g,i) {
  const cOpts = GALLERY_COLORS.map(c => `<option ${g.color===c?'selected':''}>${c}</option>`).join('');
  return `
  <div class="a-card" data-index="${i}">
    <div class="a-card__head">
      <div class="a-card__label">[${esc(g.color||'')}] ${esc(g.label||'')}</div>
      <div class="a-card__actions">
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="up">▲</button>
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="down">▼</button>
        <button class="a-btn a-btn--danger a-btn--sm" data-action="del">削除</button>
      </div>
    </div>
    <div class="a-card__grid">
      <label class="a-card__field"><span>背景カラー (c1〜c8)</span><select data-k="color">${cOpts}</select></label>
      <label class="a-card__field"><span>ラベル</span><input data-k="label" value="${esc(g.label||'')}"></label>
    </div>
  </div>`;
}

// SNS
function renderSns() {
  const list = document.getElementById('snsList');
  if (!state.sns?.length) { list.innerHTML = '<div class="a-empty">SNS未登録</div>'; return; }
  list.innerHTML = state.sns.map((s,i) => snsCardHTML(s,i)).join('');
  bindListHandlers('sns');
}

function snsCardHTML(s,i) {
  return `
  <div class="a-card" data-index="${i}">
    <div class="a-card__head">
      <div class="a-card__label">${esc(s.label||'')} → ${esc(s.url||'')}</div>
      <div class="a-card__actions">
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="up">▲</button>
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="down">▼</button>
        <button class="a-btn a-btn--danger a-btn--sm" data-action="del">削除</button>
      </div>
    </div>
    <div class="a-card__grid">
      <label class="a-card__field"><span>ラベル</span><input data-k="label" value="${esc(s.label||'')}"></label>
      <label class="a-card__field"><span>URL</span><input data-k="url" value="${esc(s.url||'#')}"></label>
    </div>
  </div>`;
}

// ---------- list handlers (shared) ----------
function bindListHandlers(key) {
  const listEl = document.getElementById(key + 'List');
  listEl.querySelectorAll('.a-card').forEach(card => {
    const idx = Number(card.dataset.index);

    // field updates
    card.querySelectorAll('[data-k]').forEach(inp => {
      inp.oninput = () => {
        state[key][idx][inp.dataset.k] = inp.value;
        save();
      };
      inp.onchange = inp.oninput;
    });

    // action buttons
    card.querySelectorAll('[data-action]').forEach(btn => {
      btn.onclick = () => {
        const act = btn.dataset.action;
        const arr = state[key];
        if (act === 'up' && idx > 0) {
          [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
        } else if (act === 'down' && idx < arr.length-1) {
          [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]];
        } else if (act === 'del') {
          if (!confirm('この項目を削除しますか？')) return;
          arr.splice(idx, 1);
        } else {
          return;
        }
        save();
        renderAll();
        setStatus(`${key} を更新しました`, 'ok');
      };
    });
  });
}

// ---------- adds ----------
function newMember() {
  return {
    id:'new_'+Date.now(), no:'00', initial:'?', colorVar:'--c-fuwari',
    colorEn:'SKYBLUE', colorJp:'水色',
    nameEn:'New Member', nameJpFamily:'姓', nameJpGiven:'名', reading:'ふりがな',
    catch:'キャッチコピー', bio:'自己紹介文を入力',
    position:'Vocal', birth:'1月1日', hobby:'', likes:''
  };
}
function newNews() {
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return { date:`${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`, category:'info', title:'新しいお知らせ', url:'#' };
}
function newSchedule() {
  return { year:'2026', month:'APR', day:'01', weekday:'MON', title:'新しい予定', meta:'会場名 / 時間', ctaType:'', ctaLabel:'Info', url:'#' };
}
function newGallery() {
  const used = (state.gallery||[]).map(g=>g.color);
  const color = GALLERY_COLORS.find(c => !used.includes(c)) || 'c1';
  return { label:'NEW / LABEL', color };
}
function newSns() { return { label:'★ / SNS', url:'#' }; }

function bindAddButtons() {
  document.getElementById('addMemberBtn').onclick = () => { state.members.push(newMember()); save(); renderMembers(); scrollToLast('memberList'); };
  document.getElementById('addNewsBtn').onclick = () => { state.news.unshift(newNews()); save(); renderNews(); };
  document.getElementById('addScheduleBtn').onclick = () => { state.schedule.push(newSchedule()); save(); renderSchedule(); scrollToLast('scheduleList'); };
  document.getElementById('addGalleryBtn').onclick = () => { state.gallery.push(newGallery()); save(); renderGallery(); scrollToLast('galleryList'); };
  document.getElementById('addSnsBtn').onclick = () => { state.sns.push(newSns()); save(); renderSns(); scrollToLast('snsList'); };
}
function scrollToLast(id) {
  const el = document.getElementById(id);
  const last = el?.lastElementChild;
  if (last) last.scrollIntoView({ behavior:'smooth', block:'center' });
}

// ---------- top actions ----------
function bindTopActions() {
  document.getElementById('downloadBtn').onclick = () => {
    const text = JSON.stringify(state, null, 2);
    download('content.json', text);
    setStatus('content.json をダウンロードしました。data/content.json に上書きしてpushしてください。', 'ok');
  };

  document.getElementById('previewBtn').onclick = () => {
    save();
    window.open('../index.html?preview=1', '_blank');
  };

  document.getElementById('loadFromFileBtn').onclick = async () => {
    if (!confirm('サーバー上のcontent.jsonを再読み込みします。現在の編集内容は失われます。よろしいですか？')) return;
    try {
      state = await fetchSiteContent();
      save();
      renderAll();
      setStatus('サーバーから再読み込みしました', 'ok');
    } catch (e) {
      setStatus('読み込みに失敗: ' + e.message, 'err');
    }
  };

  const importFile = document.getElementById('importFile');
  document.getElementById('importBtn').onclick = () => importFile.click();
  importFile.onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        state = JSON.parse(rd.result);
        save();
        renderAll();
        setStatus(`${f.name} を読み込みました`, 'ok');
      } catch (err) {
        setStatus('JSON解析エラー: ' + err.message, 'err');
      }
    };
    rd.readAsText(f);
    importFile.value = '';
  };
}

// ---------- tabs ----------
function bindTabs() {
  document.querySelectorAll('.a-tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.a-tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.a-pane').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.querySelector(`.a-pane[data-pane="${t.dataset.tab}"]`).classList.add('active');
    });
  });
}

// ---------- esc ----------
function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ---------- boot ----------
(async function boot() {
  bindTabs();
  bindAddButtons();
  bindTopActions();

  // prefer draft; if none, fetch server
  const draft = loadDraft();
  if (draft) {
    state = draft;
    setStatus('下書き（ブラウザ保存）を読み込みました。「サーバーから再読み込み」で公開版に戻せます。', '');
  } else {
    try {
      state = await fetchSiteContent();
      save();
      setStatus('公開中のcontent.jsonを読み込みました', 'ok');
    } catch (e) {
      setStatus('content.jsonの読み込みに失敗: ' + e.message + ' — file://で開いていませんか？ローカルサーバーまたは公開URLからアクセスしてください。', 'err');
      // fallback empty state
      state = { group:{}, members:[], news:[], schedule:[], gallery:[], sns:[] };
    }
  }

  renderAll();
})();
