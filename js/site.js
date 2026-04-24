/* =========================================================
   enon site - shared renderer & helpers
   ========================================================= */

const DATA_URL = (() => {
  // resolve relative to current page
  const base = location.pathname.replace(/\/[^/]*$/, '/');
  return base + 'data/content.json';
})();

// admin can preview drafts by saving JSON into localStorage under this key
const DRAFT_KEY = 'enonSiteDraft';

async function loadContent() {
  // admin preview mode via ?preview=1 uses localStorage draft
  const params = new URLSearchParams(location.search);
  if (params.get('preview') === '1') {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try { return JSON.parse(draft); } catch(e) { console.error('Draft parse error', e); }
    }
  }
  try {
    const res = await fetch(DATA_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    console.error('content.json load failed', err);
    return null;
  }
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// --- renderers ------------------------------------------------

function renderHeroConcept(group, el) {
  if (!el) return;
  el.innerHTML = `${group.conceptLine1}<br>${esc(group.conceptLine2)}`;
}

function renderHeroTagline(group, el) {
  if (!el) return;
  el.textContent = group.tagline || '';
}

function renderMemberGrid(members, el) {
  if (!el) return;
  el.innerHTML = members.map(m => `
    <a class="member-card" href="members.html#${esc(m.id)}" style="--m-color:var(${esc(m.colorVar)})">
      <div class="member-card__bg"></div>
      <div class="member-card__initial">${esc(m.initial)}</div>
      <div class="member-card__color-tag">${esc(m.colorEn)}</div>
      <div class="member-card__info">
        <div class="member-card__name-en">${esc(m.nameEn)}</div>
        <div class="member-card__name-jp">${esc(m.nameJpFamily)} ${esc(m.nameJpGiven)}</div>
      </div>
    </a>
  `).join('');
}

function renderMemberDetails(members, el) {
  if (!el) return;
  el.innerHTML = members.map(m => `
    <article class="member-detail" id="${esc(m.id)}" style="--m-color:var(${esc(m.colorVar)})">
      <div class="member-detail__visual">
        <span class="member-detail__no">No. ${esc(m.no)} / ${esc(m.colorEn)}</span>
        <span class="initial">${esc(m.initial)}</span>
      </div>
      <div class="member-detail__body">
        <div class="en-name">${esc(m.nameEn)}</div>
        <h2 class="jp-name">${esc(m.nameJpFamily)}<span> ${esc(m.nameJpGiven)}</span></h2>
        <div class="read">${esc(m.reading)}</div>
        <p class="catch">${esc(m.catch)}</p>
        <p>${esc(m.bio)}</p>
        <dl>
          <dt>Color</dt><dd>${esc(m.colorJp)}</dd>
          <dt>Position</dt><dd>${esc(m.position)}</dd>
          <dt>Birth</dt><dd>${esc(m.birth)}</dd>
          <dt>Hobby</dt><dd>${esc(m.hobby)}</dd>
          <dt>Like</dt><dd>${esc(m.likes)}</dd>
        </dl>
      </div>
    </article>
  `).join('');
}

function renderNewsList(news, el, limit) {
  if (!el) return;
  const items = limit ? news.slice(0, limit) : news;
  el.innerHTML = items.map(n => `
    <a class="news-item" href="${esc(n.url || '#')}" data-cat="${esc(n.category)}">
      <span class="news-item__date">${esc(n.date)}</span>
      <span class="news-item__tag ${esc(n.category)}">${esc(categoryLabel(n.category))}</span>
      <span class="news-item__title">${esc(n.title)}</span>
      <span class="news-item__arrow">→</span>
    </a>
  `).join('');
}

function categoryLabel(cat) {
  return ({ live:'Live', media:'Media', info:'Info', goods:'Goods' })[cat] || cat;
}

function renderScheduleList(schedule, el, limit) {
  if (!el) return;
  const items = limit ? schedule.slice(0, limit) : schedule;
  el.innerHTML = items.map(s => `
    <div class="schedule-row">
      <div class="schedule-row__date">
        <span class="m">${esc(s.month)}</span>
        <span class="d">${esc(s.day)}</span>
        <span class="w">${esc(s.weekday)}</span>
      </div>
      <div>
        <div class="schedule-row__title">${esc(s.title)}</div>
        <div class="schedule-row__meta">${esc(s.meta)}</div>
      </div>
      <a class="schedule-row__cta ${s.ctaType ? esc(s.ctaType) : ''}" href="${esc(s.url || '#')}">${esc(s.ctaLabel || 'Info')} →</a>
    </div>
  `).join('');
}

function renderScheduleGrouped(schedule, el) {
  if (!el) return;
  const byMonth = {};
  schedule.forEach(s => {
    const key = `${s.year} / ${s.month}`;
    (byMonth[key] = byMonth[key] || []).push(s);
  });
  const monthOrder = { JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12 };
  const keys = Object.keys(byMonth).sort((a,b) => {
    const [ya,ma] = a.split(' / '); const [yb,mb] = b.split(' / ');
    return ya === yb ? (monthOrder[ma]||0) - (monthOrder[mb]||0) : ya - yb;
  });
  el.innerHTML = keys.map(k => {
    const [year,mon] = k.split(' / ');
    const monthName = { JAN:'JANUARY',FEB:'FEBRUARY',MAR:'MARCH',APR:'APRIL',MAY:'MAY',JUN:'JUNE',JUL:'JULY',AUG:'AUGUST',SEP:'SEPTEMBER',OCT:'OCTOBER',NOV:'NOVEMBER',DEC:'DECEMBER' }[mon] || mon;
    return `
      <h3 class="schedule-month">${esc(year)} / ${esc(monthName)}</h3>
      <div class="schedule-list">
        ${byMonth[k].map(s => `
          <div class="schedule-row">
            <div class="schedule-row__date">
              <span class="m">${esc(s.month)}</span>
              <span class="d">${esc(s.day)}</span>
              <span class="w">${esc(s.weekday)}</span>
            </div>
            <div>
              <div class="schedule-row__title">${esc(s.title)}</div>
              <div class="schedule-row__meta">${esc(s.meta)}</div>
            </div>
            <a class="schedule-row__cta ${s.ctaType ? esc(s.ctaType) : ''}" href="${esc(s.url || '#')}">${esc(s.ctaLabel || 'Info')} →</a>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
}

function renderGallery(gallery, el) {
  if (!el) return;
  el.innerHTML = gallery.map(g => `
    <div class="gallery-cell gallery-cell--${esc(g.color)}" data-label="${esc(g.label)}"></div>
  `).join('');
}

function renderSns(sns, el) {
  if (!el) return;
  el.innerHTML = sns.map(s => `
    <a class="sns-link" href="${esc(s.url || '#')}">${esc(s.label)}</a>
  `).join('');
}

function renderFooterCopy(group) {
  const cp = document.querySelector('[data-slot="copyright"]');
  const db = document.querySelector('[data-slot="debutLine"]');
  if (cp) cp.textContent = group.copyright;
  if (db) db.textContent = group.debutLine;
}

// --- scroll reveal ---------------------------------------------
function initReveal(selectors) {
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target);} });
  }, { threshold: .1 });
  document.querySelectorAll(selectors).forEach(el => { el.classList.add('reveal'); io.observe(el); });
}

// --- mobile menu ------------------------------------------------
function initMobileMenu() {
  const btn = document.querySelector('.menu-toggle');
  const nav = document.getElementById('nav');
  if (btn && nav) btn.addEventListener('click', () => nav.classList.toggle('open'));
}

// --- back to top ------------------------------------------------
function initBackToTop() {
  if (document.querySelector('.back-to-top')) return;
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'ページ上部に戻る');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5 L12 19 M5 12 L12 5 L19 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  btn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
  document.body.appendChild(btn);
  const threshold = 400;
  const onScroll = () => btn.classList.toggle('visible', window.scrollY > threshold);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// --- news filter ------------------------------------------------
function initNewsFilter() {
  const chips = document.querySelectorAll('#filter .filter-chip');
  if (!chips.length) return;
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    const f = c.dataset.filter;
    document.querySelectorAll('#newslist .news-item').forEach(i => {
      i.style.display = (f === 'all' || i.dataset.cat === f) ? '' : 'none';
    });
  }));
}

// --- page init --------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  initMobileMenu();
  initBackToTop();

  const data = await loadContent();
  if (!data) return;

  renderFooterCopy(data.group);

  // TOP page
  renderHeroTagline(data.group, document.querySelector('[data-slot="tagline"]'));
  renderHeroConcept(data.group, document.querySelector('[data-slot="concept"]'));
  renderMemberGrid(data.members, document.querySelector('[data-slot="memberGrid"]'));
  renderNewsList(data.news, document.querySelector('[data-slot="newsTop"]'), 4);
  renderScheduleList(data.schedule, document.querySelector('[data-slot="scheduleTop"]'), 3);
  renderGallery(data.gallery, document.querySelector('[data-slot="gallery"]'));
  renderSns(data.sns, document.querySelector('[data-slot="sns"]'));

  // Members page
  renderMemberDetails(data.members, document.querySelector('[data-slot="memberDetails"]'));

  // News page
  renderNewsList(data.news, document.querySelector('[data-slot="newsFull"]'));
  initNewsFilter();

  // Schedule page
  renderScheduleGrouped(data.schedule, document.querySelector('[data-slot="scheduleFull"]'));

  // After render: init scroll reveals for all dynamic items
  initReveal('.section__inner, .hero__concept, .member-card, .schedule-row, .news-item, .member-detail');

  // handle hash scroll after members render
  if (location.hash) {
    setTimeout(() => {
      const tgt = document.querySelector(location.hash);
      if (tgt) tgt.scrollIntoView({ behavior:'smooth', block:'start' });
    }, 100);
  }
});
