/* =========================================================
   enon admin - CRUD editor for content.json
   ========================================================= */

const DRAFT_KEY = 'enonSiteDraft';
const SETTINGS_KEY = 'enonAdminSettings';
const AUTH_KEY = 'enonAdminAuth';
const DATA_URL = '../data/content.json';
const CONTENT_PATH = 'data/content.json';

// sha256("taiki:tike1202#:enon_admin_salt_2026")
const EXPECTED_HASH = '286ec8fa166711cda8b43ac4c546ee8ac080ecb7d29307fb3023d6bcbe4c3d15';
const AUTH_SALT = 'enon_admin_salt_2026';
const AUTH_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

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
const SCHEDULE_TYPES = ['LIVE','EVENT','MEDIA'];

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
  const list = document.getElementById('membersList');
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
      <label class="a-card__field"><span>No.（並び順で自動）</span><input data-k="no" value="${esc(m.no||'')}" readonly title="▲▼ボタンで並び替えると自動で更新されます"></label>
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
function sortNewsByDateDesc() {
  if (!state.news) return;
  state.news.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

function renderNews() {
  const list = document.getElementById('newsList');
  if (!state.news?.length) { list.innerHTML = '<div class="a-empty">ニュース未登録</div>'; return; }
  sortNewsByDateDesc();
  list.innerHTML = state.news.map((n,i) => newsCardHTML(n,i)).join('');
  bindListHandlers('news');
}

function newsCardHTML(n,i) {
  const catOpts = NEWS_CATEGORIES.map(c => `<option value="${c}" ${n.category===c?'selected':''}>${c.toUpperCase()}</option>`).join('');
  const hasImage = !!n.image;
  const previewSrc = hasImage ? `../${esc(n.image)}` : '';
  return `
  <div class="a-card" data-index="${i}">
    <div class="a-card__head">
      <div class="a-card__label">
        <span class="a-card__badge ${esc(n.category||'')}">${esc((n.category||'').toUpperCase())}</span>
        &nbsp;${esc(n.date||'')} - ${esc((n.title||'').slice(0,40))}
      </div>
      <div class="a-card__actions">
        <button class="a-btn a-btn--danger a-btn--sm" data-action="del">削除</button>
      </div>
    </div>
    <div class="a-card__grid a-card__grid--4">
      <label class="a-card__field"><span>ID (詳細URLに使用 / 半角英数・ハイフン)</span><input data-k="id" data-news-id-input value="${esc(n.id||'')}" title="任意の英数字に変更できます。変更すると既存のシェアリンクが無効になります"></label>
      <label class="a-card__field"><span>日付 (YYYY.MM.DD)</span><input data-k="date" value="${esc(n.date||'')}"></label>
      <label class="a-card__field"><span>カテゴリ</span><select data-k="category">${catOpts}</select></label>
      <label class="a-card__field a-card__field--wide"><span>タイトル</span><input data-k="title" value="${esc(n.title||'')}"></label>
    </div>
    <div class="a-gallery-row" style="margin-top:14px">
      <div class="a-gallery-preview${hasImage ? '' : ' a-gallery-preview--empty'}">
        ${hasImage ? `<img src="${previewSrc}" alt="" onerror="this.style.display='none';this.parentElement.classList.add('a-gallery-preview--err');this.parentElement.dataset.err='画像が見つかりません'">` : '<span>画像なし</span>'}
      </div>
      <div class="a-gallery-fields">
        <label class="a-card__field"><span>画像パス（直接編集可）</span><input data-k="image" value="${esc(n.image||'')}" placeholder="images/news/photo.jpg"></label>
        <div class="a-card__field">
          <span>詳細ページの画像をアップロード</span>
          <div class="a-upload">
            <input type="file" accept="image/*" id="news-upload-${i}" data-news-upload-idx="${i}">
            <label for="news-upload-${i}" class="a-btn a-btn--ghost a-btn--sm">📁 ファイルを選ぶ</label>
            ${hasImage ? `<button type="button" class="a-btn a-btn--danger a-btn--sm" data-news-clear-image="${i}">画像をクリア</button>` : ''}
          </div>
        </div>
      </div>
    </div>
    <label class="a-card__field" style="margin-top:14px">
      <span>本文（改行あり、段落は空行で区切る / Google Maps・YouTube等の &lt;iframe&gt; 埋め込みコード貼り付け可）</span>
      <textarea data-k="body" rows="8" style="min-height:180px">${esc(n.body||'')}</textarea>
    </label>
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
  const typeOpts = SCHEDULE_TYPES.map(t => `<option ${s.type===t?'selected':''}>${t}</option>`).join('');
  const hasImage = !!s.image;
  const previewSrc = hasImage ? `../${esc(s.image)}` : '';
  return `
  <div class="a-card" data-index="${i}">
    <div class="a-card__head">
      <div class="a-card__label">
        ${s.type ? `<span class="a-card__badge ${esc((s.type||'').toLowerCase())}">${esc(s.type)}</span>` : ''}
        ${s.region ? `[${esc(s.region)}] ` : ''}${esc(s.year||'')}/${esc(s.month||'')}.${esc(s.day||'')} - ${esc((s.title||'').slice(0,40))}
      </div>
      <div class="a-card__actions">
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="up">▲</button>
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="down">▼</button>
        <button class="a-btn a-btn--danger a-btn--sm" data-action="del">削除</button>
      </div>
    </div>
    <div class="a-card__grid a-card__grid--4">
      <label class="a-card__field"><span>ID (詳細URL)</span><input data-k="id" data-schedule-id-input value="${esc(s.id||'')}" title="任意の英数字に変更できます"></label>
      <label class="a-card__field"><span>地域</span><input data-k="region" value="${esc(s.region||'')}" placeholder="東京・大阪 など"></label>
      <label class="a-card__field"><span>種類</span><select data-k="type">${typeOpts}</select></label>
      <label class="a-card__field"><span>年</span><input data-k="year" value="${esc(s.year||'')}"></label>
      <label class="a-card__field"><span>月</span><select data-k="month">${monOpts}</select></label>
      <label class="a-card__field"><span>日</span><input data-k="day" value="${esc(s.day||'')}" maxlength="2"></label>
      <label class="a-card__field"><span>曜日</span><select data-k="weekday">${wOpts}</select></label>
      <label class="a-card__field"><span>ボタン種別</span><select data-k="ctaType">${ctaOpts}</select></label>
      <label class="a-card__field a-card__field--wide"><span>タイトル</span><input data-k="title" value="${esc(s.title||'')}"></label>
      <label class="a-card__field a-card__field--wide"><span>会場・補足情報（一覧に表示）</span><input data-k="meta" value="${esc(s.meta||'')}"></label>
      <label class="a-card__field"><span>ボタンラベル</span><input data-k="ctaLabel" value="${esc(s.ctaLabel||'Info')}"></label>
      <label class="a-card__field a-card__field--wide"><span>リンクURL（チケット販売など）</span><input data-k="url" value="${esc(s.url||'#')}"></label>
    </div>
    <div class="a-gallery-row" style="margin-top:14px">
      <div class="a-gallery-preview${hasImage ? '' : ' a-gallery-preview--empty'}">
        ${hasImage ? `<img src="${previewSrc}" alt="" onerror="this.style.display='none';this.parentElement.classList.add('a-gallery-preview--err');this.parentElement.dataset.err='画像が見つかりません'">` : '<span>画像なし</span>'}
      </div>
      <div class="a-gallery-fields">
        <label class="a-card__field"><span>画像パス（直接編集可）</span><input data-k="image" value="${esc(s.image||'')}" placeholder="images/schedule/photo.jpg"></label>
        <div class="a-card__field">
          <span>詳細ページの画像をアップロード</span>
          <div class="a-upload">
            <input type="file" accept="image/*" id="schedule-upload-${i}" data-schedule-upload-idx="${i}">
            <label for="schedule-upload-${i}" class="a-btn a-btn--ghost a-btn--sm">📁 ファイルを選ぶ</label>
            ${hasImage ? `<button type="button" class="a-btn a-btn--danger a-btn--sm" data-schedule-clear-image="${i}">画像をクリア</button>` : ''}
          </div>
        </div>
      </div>
    </div>
    <label class="a-card__field" style="margin-top:14px">
      <span>本文（改行あり、段落は空行で区切る / Google Maps・YouTube等の &lt;iframe&gt; 埋め込みコード貼り付け可）</span>
      <textarea data-k="body" rows="8" style="min-height:180px">${esc(s.body||'')}</textarea>
    </label>
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
  const hasImage = !!g.image;
  const previewSrc = hasImage ? `../${esc(g.image)}` : '';
  return `
  <div class="a-card" data-index="${i}">
    <div class="a-card__head">
      <div class="a-card__label">${hasImage ? '🖼 画像あり' : `[${esc(g.color||'c1')}] プレースホルダー`} / ${esc(g.label||'')}</div>
      <div class="a-card__actions">
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="up">▲</button>
        <button class="a-btn a-btn--ghost a-btn--sm" data-action="down">▼</button>
        <button class="a-btn a-btn--danger a-btn--sm" data-action="del">削除</button>
      </div>
    </div>
    <div class="a-gallery-row">
      <div class="a-gallery-preview${hasImage ? '' : ' a-gallery-preview--empty'}">
        ${hasImage ? `<img src="${previewSrc}" alt="" onerror="this.style.display='none';this.parentElement.classList.add('a-gallery-preview--err');this.parentElement.dataset.err='画像が見つかりません'">` : '<span>画像なし</span>'}
      </div>
      <div class="a-gallery-fields">
        <label class="a-card__field"><span>ラベル</span><input data-k="label" value="${esc(g.label||'')}"></label>
        <label class="a-card__field"><span>画像パス（直接編集可）</span><input data-k="image" value="${esc(g.image||'')}" placeholder="images/gallery/photo.jpg"></label>
        <div class="a-card__field">
          <span>画像を選択してアップロード</span>
          <div class="a-upload">
            <input type="file" accept="image/*" id="gallery-upload-${i}" data-upload-idx="${i}">
            <label for="gallery-upload-${i}" class="a-btn a-btn--ghost a-btn--sm">📁 ファイルを選ぶ</label>
            ${hasImage ? `<button type="button" class="a-btn a-btn--danger a-btn--sm" data-clear-image="${i}">画像をクリア</button>` : ''}
          </div>
        </div>
        <label class="a-card__field"><span>画像なしの時の背景カラー</span><select data-k="color">${cOpts}</select></label>
      </div>
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
        if (key === 'members') renumberMembers();
        save();
        renderAll();
        setStatus(`${key} を更新しました`, 'ok');
      };
    });

    // gallery-specific: image upload and clear
    if (key === 'gallery') {
      const upInput = card.querySelector('[data-upload-idx]');
      if (upInput) {
        upInput.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) {
            setStatus('画像ファイルを選んでください', 'err');
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            setStatus('ファイルが大きすぎます（5MB以下にしてください）', 'err');
            return;
          }
          try {
            setStatus(`画像をアップロード中: ${file.name} (${(file.size/1024).toFixed(0)} KB)...`, '');
            const path = await uploadImageToGitHub(file, 'gallery');
            state.gallery[idx].image = path;
            save();
            renderGallery();
            setStatus(`✓ 画像アップロード成功: ${path}`, 'ok');
          } catch (err) {
            setStatus('アップロード失敗: ' + err.message, 'err');
          }
          e.target.value = '';
        };
      }
      const clearBtn = card.querySelector('[data-clear-image]');
      if (clearBtn) {
        clearBtn.onclick = () => {
          if (!confirm('画像の関連付けをクリアしますか？（GitHub上のファイルは残ります）')) return;
          state.gallery[idx].image = '';
          save();
          renderGallery();
          setStatus('画像をクリアしました', 'ok');
        };
      }
    }

    // schedule-specific: image upload, id sanitization
    if (key === 'schedule') {
      // sanitize ID on blur
      const idInput = card.querySelector('[data-schedule-id-input]');
      if (idInput) {
        idInput.addEventListener('blur', () => {
          let v = (idInput.value || '').trim().toLowerCase();
          v = v.replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          if (!v) {
            const s = state.schedule[idx];
            const safeDate = `${s.year || ''}${s.month || ''}${s.day || ''}`.replace(/\W/g, '') || String(Date.now());
            v = `event-${safeDate}-${Math.random().toString(36).slice(2,6)}`;
          }
          const dup = state.schedule.some((n, i) => i !== idx && n.id === v);
          if (dup) v = v + '-' + Math.random().toString(36).slice(2,5);
          idInput.value = v;
          state.schedule[idx].id = v;
          save();
        });
      }
      // image upload
      const upInput = card.querySelector('[data-schedule-upload-idx]');
      if (upInput) {
        upInput.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) {
            setStatus('画像ファイルを選んでください', 'err');
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            setStatus('ファイルが大きすぎます（5MB以下にしてください）', 'err');
            return;
          }
          try {
            setStatus(`画像をアップロード中: ${file.name} (${(file.size/1024).toFixed(0)} KB)...`, '');
            const path = await uploadImageToGitHub(file, 'schedule');
            state.schedule[idx].image = path;
            save();
            renderSchedule();
            setStatus(`✓ 画像アップロード成功: ${path}`, 'ok');
          } catch (err) {
            setStatus('アップロード失敗: ' + err.message, 'err');
          }
          e.target.value = '';
        };
      }
      const clearBtn = card.querySelector('[data-schedule-clear-image]');
      if (clearBtn) {
        clearBtn.onclick = () => {
          if (!confirm('画像の関連付けをクリアしますか？（GitHub上のファイルは残ります）')) return;
          state.schedule[idx].image = '';
          save();
          renderSchedule();
          setStatus('画像をクリアしました', 'ok');
        };
      }
    }

    // news-specific: image upload, id sanitization, date-based reorder
    if (key === 'news') {
      // re-sort on date change (blur)
      const dateInput = card.querySelector('input[data-k="date"]');
      if (dateInput) {
        dateInput.addEventListener('blur', () => {
          sortNewsByDateDesc();
          save();
          renderNews();
          setStatus('日付に応じて並び順を更新しました', 'ok');
        });
      }
      // sanitize ID on blur (keep URL-safe: alphanumeric, dash, underscore)
      const idInput = card.querySelector('[data-news-id-input]');
      if (idInput) {
        idInput.addEventListener('blur', () => {
          let v = (idInput.value || '').trim().toLowerCase();
          v = v.replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          if (!v) {
            const safeDate = (state.news[idx].date || '').replace(/\D/g, '') || String(Date.now());
            v = `news-${safeDate}-${Math.random().toString(36).slice(2,6)}`;
          }
          // check uniqueness; append suffix if duplicate
          const dup = state.news.some((n, i) => i !== idx && n.id === v);
          if (dup) v = v + '-' + Math.random().toString(36).slice(2,5);
          idInput.value = v;
          state.news[idx].id = v;
          save();
        });
      }
      const upInput = card.querySelector('[data-news-upload-idx]');
      if (upInput) {
        upInput.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) {
            setStatus('画像ファイルを選んでください', 'err');
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            setStatus('ファイルが大きすぎます（5MB以下にしてください）', 'err');
            return;
          }
          try {
            setStatus(`画像をアップロード中: ${file.name} (${(file.size/1024).toFixed(0)} KB)...`, '');
            const path = await uploadImageToGitHub(file, 'news');
            state.news[idx].image = path;
            save();
            renderNews();
            setStatus(`✓ 画像アップロード成功: ${path}`, 'ok');
          } catch (err) {
            setStatus('アップロード失敗: ' + err.message, 'err');
          }
          e.target.value = '';
        };
      }
      const clearBtn = card.querySelector('[data-news-clear-image]');
      if (clearBtn) {
        clearBtn.onclick = () => {
          if (!confirm('画像の関連付けをクリアしますか？（GitHub上のファイルは残ります）')) return;
          state.news[idx].image = '';
          save();
          renderNews();
          setStatus('画像をクリアしました', 'ok');
        };
      }
    }
  });
}

// ---------- Image upload to GitHub ----------
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = r.result;
      const b64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
      resolve(b64);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function sanitizeFilename(name) {
  const ext = (name.match(/\.[a-zA-Z0-9]+$/) || [''])[0].toLowerCase();
  const base = name.replace(ext, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'image';
  return base + ext;
}
async function uploadImageToGitHub(file, folder = 'gallery') {
  const s = loadSettings();
  if (!s.owner || !s.repo || !s.token) {
    throw new Error('接続設定を先に完了してください');
  }
  const fname = sanitizeFilename(file.name);
  const ts = Date.now();
  const pathInRepo = `images/${folder}/${ts}_${fname}`;
  const b64 = await fileToBase64(file);
  const apiUrl = `https://api.github.com/repos/${s.owner}/${s.repo}/contents/${pathInRepo}`;

  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${s.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json'
    },
    body: JSON.stringify({
      message: `Upload ${folder} image: ${pathInRepo}`,
      content: b64,
      branch: s.branch
    })
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(`HTTP ${res.status} - ${j.message || ''}`);
  }
  return pathInRepo;
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

// Renumber all members so their "no" matches array position (01, 02, 03, ...)
function renumberMembers() {
  if (!state.members) return;
  state.members.forEach((m, i) => {
    m.no = String(i + 1).padStart(2, '0');
  });
}
function newNews() {
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  const date = `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`;
  const id = `news-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2,8)}`;
  return {
    id, date, category:'info',
    title:'新しいお知らせ',
    image:'',
    body:'ここに本文を入力してください。\n\n段落を分けたいときは空行を挟みます。'
  };
}

// ensure every news item has a stable id (auto-generate if missing)
function ensureNewsIds() {
  if (!state || !state.news) return;
  state.news.forEach((n, i) => {
    if (!n.id) {
      const safeDate = (n.date || '').replace(/\D/g, '') || String(Date.now());
      n.id = `news-${safeDate}-${Math.random().toString(36).slice(2,6)}`;
    }
  });
}
function newSchedule() {
  const ts = Date.now();
  return {
    id: `event-${ts}-${Math.random().toString(36).slice(2,6)}`,
    year:'2026', month:'APR', day:'01', weekday:'MON',
    region: '東京', type: 'LIVE',
    title:'新しい予定', meta:'会場名 / 時間',
    ctaType:'', ctaLabel:'Info', url:'#',
    image:'', body:''
  };
}

// auto-generate ID for schedule items missing one (migration for older content.json)
function ensureScheduleIds() {
  if (!state || !state.schedule) return;
  state.schedule.forEach(s => {
    if (!s.id) {
      const safeDate = `${s.year || ''}${s.month || ''}${s.day || ''}`.replace(/\W/g, '') || String(Date.now());
      s.id = `event-${safeDate}-${Math.random().toString(36).slice(2,6)}`;
    }
  });
}
function newGallery() {
  const used = (state.gallery||[]).map(g=>g.color);
  const color = GALLERY_COLORS.find(c => !used.includes(c)) || 'c1';
  return { label:'NEW / LABEL', color };
}
function newSns() { return { label:'★ / SNS', url:'#' }; }

function bindAddButtons() {
  document.getElementById('addMemberBtn').onclick = () => { state.members.push(newMember()); renumberMembers(); save(); renderMembers(); scrollToLast('membersList'); };
  document.getElementById('addNewsBtn').onclick = () => {
    state.news.unshift(newNews());
    sortNewsByDateDesc();
    save();
    renderNews();
  };
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
    setStatus('content.json をダウンロードしました', 'ok');
  };

  document.getElementById('previewBtn').onclick = () => {
    save();
    window.open('../index.html?preview=1', '_blank');
  };

  document.getElementById('loadFromFileBtn').onclick = async () => {
    if (!confirm('公開中のcontent.jsonを再読み込みします。編集中の内容は失われます。よろしいですか？')) return;
    try {
      state = await fetchSiteContent();
      save();
      renderAll();
      setStatus('公開版を再読み込みしました', 'ok');
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

  document.getElementById('publishBtn').onclick = publishToGitHub;
}

// ---------- GitHub settings ----------
function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
  catch { return {}; }
}
function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function autoDetectRepo() {
  // from github.io URL: https://<owner>.github.io/<repo>/admin/
  const h = location.hostname;
  const m = h.match(/^([^.]+)\.github\.io$/);
  if (m) {
    const path = location.pathname.split('/').filter(Boolean);
    if (path.length >= 1) return { owner: m[1], repo: path[0] };
  }
  return null;
}

function renderSettingsInputs() {
  const s = loadSettings();
  const detected = autoDetectRepo();
  const ownerEl = document.getElementById('gh-owner');
  const repoEl = document.getElementById('gh-repo');
  const branchEl = document.getElementById('gh-branch');
  const tokenEl = document.getElementById('gh-token');
  ownerEl.value = s.owner ?? detected?.owner ?? '';
  repoEl.value = s.repo ?? detected?.repo ?? '';
  branchEl.value = s.branch ?? 'main';
  tokenEl.value = s.token ?? '';
}

function bindSettingsActions() {
  renderSettingsInputs();

  document.getElementById('saveSettingsBtn').onclick = () => {
    const s = {
      owner: document.getElementById('gh-owner').value.trim(),
      repo: document.getElementById('gh-repo').value.trim(),
      branch: (document.getElementById('gh-branch').value.trim() || 'main'),
      token: document.getElementById('gh-token').value.trim()
    };
    saveSettings(s);
    setStatus('接続設定を保存しました', 'ok');
  };

  document.getElementById('testConnBtn').onclick = async () => {
    const s = loadSettings();
    if (!s.token) { setStatus('Tokenを入力して保存してください', 'err'); return; }
    setStatus('接続中...', '');
    try {
      const res = await fetch(`https://api.github.com/repos/${s.owner}/${s.repo}`, {
        headers: { Authorization: `token ${s.token}`, Accept: 'application/vnd.github+json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${(await res.json()).message || ''}`);
      const info = await res.json();
      setStatus(`✓ 接続成功: ${info.full_name} (${info.private ? 'private' : 'public'})`, 'ok');
    } catch (e) {
      setStatus('接続失敗: ' + e.message, 'err');
    }
  };

  document.getElementById('clearTokenBtn').onclick = () => {
    if (!confirm('Tokenを削除します。よろしいですか？')) return;
    const s = loadSettings();
    delete s.token;
    saveSettings(s);
    document.getElementById('gh-token').value = '';
    setStatus('Tokenを削除しました', 'ok');
  };

  const showChk = document.getElementById('gh-showToken');
  const tokenInp = document.getElementById('gh-token');
  showChk.onchange = () => tokenInp.type = showChk.checked ? 'text' : 'password';
}

// ---------- Publish directly to GitHub ----------
async function publishToGitHub() {
  const s = loadSettings();
  if (!s.owner || !s.repo || !s.token) {
    setStatus('接続設定が未完了です。「⚙ 接続設定」タブで入力してください。', 'err');
    document.querySelector('.a-tab[data-tab="settings"]').click();
    return;
  }

  // Sync DOM form values into state as a safety net (in case a field didn't fire input)
  syncDomToState();
  // ensure news is sorted by date descending before publish
  sortNewsByDateDesc();
  save();

  setStatus('GitHubに公開中...', '');
  try {
    const apiBase = `https://api.github.com/repos/${s.owner}/${s.repo}/contents/${CONTENT_PATH}`;

    // 1) get current file
    let sha = null;
    let currentB64 = '';
    const cur = await fetch(`${apiBase}?ref=${encodeURIComponent(s.branch)}`, {
      headers: { Authorization: `token ${s.token}`, Accept:'application/vnd.github+json' }
    });
    if (cur.ok) {
      const j = await cur.json();
      sha = j.sha;
      currentB64 = (j.content || '').replace(/\s/g, '');
    } else if (cur.status !== 404) {
      throw new Error(`取得失敗: HTTP ${cur.status} - ${(await cur.json()).message || ''}`);
    }

    // 2) build payload
    const json = JSON.stringify(state, null, 2);
    const b64 = utf8ToBase64(json);

    // 3) diff check — skip if nothing changed
    if (currentB64 === b64) {
      setStatus('⚠ 変更はありません（公開中の内容と完全に同じです）。フィールドを編集してから再度お試しください。', 'err');
      return;
    }

    const msg = prompt('コミットメッセージを入力してください', 'Update site content via admin');
    if (!msg) { setStatus('キャンセルしました', ''); return; }

    const body = { message: msg, content: b64, branch: s.branch };
    if (sha) body.sha = sha;

    // 4) PUT
    const res = await fetch(apiBase, {
      method: 'PUT',
      headers: { Authorization: `token ${s.token}`, 'Content-Type':'application/json', Accept:'application/vnd.github+json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(`HTTP ${res.status} - ${j.message || ''}`);
    }
    const result = await res.json();
    const sizeKB = (json.length / 1024).toFixed(1);
    setStatus(`✓ 公開成功: commit ${result.commit.sha.slice(0,7)} (${sizeKB} KB) — 数十秒後にサイトに反映されます`, 'ok');
  } catch (e) {
    setStatus('公開失敗: ' + e.message, 'err');
  }
}

// Safety net: read all input/select/textarea values from DOM back into state
function syncDomToState() {
  // group inputs
  document.querySelectorAll('[data-group]').forEach(inp => {
    state.group[inp.dataset.group] = inp.value;
  });
  // list items (members/news/schedule/gallery/sns)
  ['members','news','schedule','gallery','sns'].forEach(key => {
    const listEl = document.getElementById(key + 'List');
    if (!listEl) return;
    listEl.querySelectorAll('.a-card').forEach(card => {
      const idx = Number(card.dataset.index);
      if (!state[key] || !state[key][idx]) return;
      card.querySelectorAll('[data-k]').forEach(inp => {
        state[key][idx][inp.dataset.k] = inp.value;
      });
    });
  });
  save();
}

function utf8ToBase64(str) {
  // handle UTF-8 safely (including Japanese)
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin);
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

// ---------- Auth ----------
async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function getAuthRecord() {
  try {
    // check persistent auth first
    const persistent = localStorage.getItem(AUTH_KEY);
    if (persistent) {
      const r = JSON.parse(persistent);
      if (r.expire && r.expire > Date.now()) return r;
      localStorage.removeItem(AUTH_KEY);
    }
    // session auth
    const session = sessionStorage.getItem(AUTH_KEY);
    if (session) return JSON.parse(session);
  } catch {}
  return null;
}
function setAuthRecord(remember) {
  const r = { ok: true, at: Date.now(), expire: Date.now() + AUTH_MAX_AGE };
  if (remember) localStorage.setItem(AUTH_KEY, JSON.stringify(r));
  else sessionStorage.setItem(AUTH_KEY, JSON.stringify(r));
}
function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(AUTH_KEY);
}
function unlockAdmin() {
  document.body.classList.remove('a-locked');
}
function lockAdmin() {
  document.body.classList.add('a-locked');
  const u = document.getElementById('loginUser');
  const p = document.getElementById('loginPass');
  if (u) u.value = '';
  if (p) p.value = '';
}

function bindLogin() {
  const form = document.getElementById('loginForm');
  const errEl = document.getElementById('loginError');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.hidden = true;
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const remember = document.getElementById('loginRemember').checked;
    const hash = await sha256(`${user}:${pass}:${AUTH_SALT}`);
    if (hash === EXPECTED_HASH) {
      setAuthRecord(remember);
      unlockAdmin();
      // init admin content after auth
      if (!window.__adminBooted) {
        window.__adminBooted = true;
        bootAdmin();
      }
    } else {
      errEl.textContent = 'ユーザー名またはパスワードが間違っています';
      errEl.hidden = false;
    }
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      if (!confirm('ログアウトしますか？')) return;
      clearAuth();
      lockAdmin();
    };
  }
}

// ---------- boot ----------
async function bootAdmin() {
  bindTabs();
  bindAddButtons();
  bindTopActions();
  bindSettingsActions();

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

  // normalize: ensure news/schedule entries have IDs and sort news by date desc
  ensureNewsIds();
  ensureScheduleIds();
  sortNewsByDateDesc();
  save();

  renderAll();
}

// ---------- Entry ----------
(function () {
  bindLogin();
  const auth = getAuthRecord();
  if (auth && auth.ok) {
    unlockAdmin();
    window.__adminBooted = true;
    bootAdmin();
  } else {
    lockAdmin();
    // focus on user field for convenience
    setTimeout(() => document.getElementById('loginUser')?.focus(), 100);
  }
})();
