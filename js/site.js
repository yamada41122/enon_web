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

// SNS icons (inline SVG, currentColor)
const SNS_ICONS = {
  x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r=".9" fill="currentColor"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424v-7a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/></svg>'
};
const SNS_LABEL = { x: 'X', instagram: 'Instagram', tiktok: 'TikTok' };

function memberSnsHtml(sns, prefix) {
  if (!sns || !sns.length) return '';
  const icons = sns
    .filter(s => s && s.url && s.url.trim() && SNS_ICONS[s.type])
    .map(s => `
      <a class="${prefix}__icon ${prefix}__icon--${esc(s.type)}" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(SNS_LABEL[s.type] || s.type)}" title="${esc(SNS_LABEL[s.type] || s.type)}">
        ${SNS_ICONS[s.type]}
      </a>`)
    .join('');
  if (!icons) return '';
  return `<div class="${prefix}">${icons}</div>`;
}

function renderMemberGrid(members, el) {
  if (!el) return;
  el.innerHTML = members.map(m => `
    <div class="member-card-wrap">
      <a class="member-card" href="members.html#${esc(m.id)}" style="--m-color:var(${esc(m.colorVar)})">
        <div class="member-card__bg"></div>
        <div class="member-card__initial">${esc(m.initial)}</div>
        <div class="member-card__color-tag">${esc(m.colorEn)}</div>
        <div class="member-card__info">
          <div class="member-card__name-en">${esc(m.nameEn)}</div>
          <div class="member-card__name-jp">${esc(m.nameJpFamily)} ${esc(m.nameJpGiven)}</div>
        </div>
      </a>
      ${memberSnsHtml(m.sns, 'member-card__sns')}
    </div>
  `).join('');
}

function renderGroupSection(group, el) {
  if (!el) return;
  const hasConcept = group && (group.conceptLine1 || group.conceptLine2);
  if (!hasConcept) {
    el.innerHTML = '';
    el.style.display = 'none';
    return;
  }
  el.style.display = '';
  el.innerHTML = `
    <div class="group-section__inner">
      <div class="group-section__kicker">${esc(group.tagline || '')}</div>
      <h2 class="group-section__name">${esc(group.name || '')}<span class="group-section__reading">${group.reading ? '— ' + esc(group.reading) : ''}</span></h2>
      <div class="group-section__concept">
        ${group.conceptLine1 ? `<p>${group.conceptLine1}</p>` : ''}
        ${group.conceptLine2 ? `<p>${esc(group.conceptLine2)}</p>` : ''}
      </div>
    </div>
  `;
}

function renderArtistFilter(data, filterEl, groupEl, memberEl) {
  if (!filterEl) return;
  const hasGroup = !!(data.group && (data.group.conceptLine1 || data.group.conceptLine2));
  const hasMember = data.members && data.members.length > 0;
  if (!hasGroup && !hasMember) {
    filterEl.innerHTML = '';
    return;
  }
  const chips = ['<button class="filter-chip active" data-artist-filter="all">All</button>'];
  if (hasGroup)  chips.push('<button class="filter-chip" data-artist-filter="group">Group</button>');
  if (hasMember) chips.push('<button class="filter-chip" data-artist-filter="member">Member</button>');
  filterEl.innerHTML = `<div class="filter-row" style="margin-bottom:32px">${chips.join('')}</div>`;

  filterEl.querySelectorAll('.filter-chip').forEach(c => {
    c.addEventListener('click', () => {
      filterEl.querySelectorAll('.filter-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      const f = c.dataset.artistFilter;
      if (groupEl)  groupEl.style.display  = (f === 'all' || f === 'group')  ? '' : 'none';
      if (memberEl) memberEl.style.display = (f === 'all' || f === 'member') ? '' : 'none';
    });
  });
}

function renderMemberDetails(members, el) {
  if (!el) return;
  el.innerHTML = members.map(m => `
    <article class="member-detail" id="${esc(m.id)}" style="--m-color:var(${esc(m.colorVar)})">
      <div class="member-detail__visual-wrap">
        <div class="member-detail__visual">
          <span class="member-detail__no">No. ${esc(m.no)} / ${esc(m.colorEn)}</span>
          <span class="initial">${esc(m.initial)}</span>
        </div>
        ${memberSnsHtml(m.sns, 'member-detail__sns')}
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

function sortNewsByDateDesc(news) {
  return [...(news || [])].sort((a, b) =>
    (b.date || '').localeCompare(a.date || '')
  );
}

function renderNewsList(news, el, limit) {
  if (!el) return;
  const sorted = sortNewsByDateDesc(news);
  const items = limit ? sorted.slice(0, limit) : sorted;
  el.innerHTML = items.map(n => {
    const detailUrl = n.id ? `news-detail.html?id=${encodeURIComponent(n.id)}` : (n.url || '#');
    return `<a class="news-item" href="${esc(detailUrl)}" data-cat="${esc(n.category)}">
      <span class="news-item__date">${esc(n.date)}</span>
      <span class="news-item__tag ${esc(n.category)}">${esc(categoryLabel(n.category))}</span>
      <span class="news-item__title">${esc(n.title)}</span>
      <span class="news-item__arrow">→</span>
    </a>`;
  }).join('');
}

// Trusted iframe src prefixes for embeds (Google Maps, YouTube, etc.)
const TRUSTED_EMBED_PREFIXES = [
  'https://www.google.com/maps/embed',
  'https://maps.google.com/maps?',
  'https://www.google.com/maps?',
  'https://www.youtube.com/embed/',
  'https://www.youtube-nocookie.com/embed/',
  'https://player.vimeo.com/video/',
  'https://w.soundcloud.com/player/',
  'https://open.spotify.com/embed/',
  'https://embed.music.apple.com/',
  'https://platform.twitter.com/embed/',
  'https://www.instagram.com/p/'
];

function isSafeEmbedSrc(src) {
  return TRUSTED_EMBED_PREFIXES.some(prefix => src.startsWith(prefix));
}

function wrapIframe(iframeHtml) {
  // extract dimensions to compute aspect-ratio
  const wMatch = iframeHtml.match(/\bwidth\s*=\s*["']?(\d+)/i);
  const hMatch = iframeHtml.match(/\bheight\s*=\s*["']?(\d+)/i);
  let aspect = '16 / 9';
  if (wMatch && hMatch) {
    const w = parseInt(wMatch[1], 10);
    const h = parseInt(hMatch[1], 10);
    if (w > 0 && h > 0) aspect = `${w} / ${h}`;
  }
  // strip width/height attrs so CSS can size responsively
  let cleaned = iframeHtml
    .replace(/\b(width|height)\s*=\s*["']?[^\s"'>]+["']?/gi, '')
    .replace(/\bstyle\s*=\s*"[^"]*"/gi, '')
    .replace(/\bstyle\s*=\s*'[^']*'/gi, '');
  // ensure loading=lazy
  if (!/\bloading=/.test(cleaned)) {
    cleaned = cleaned.replace(/<iframe\b/i, '<iframe loading="lazy"');
  }
  return `<div class="news-embed" style="aspect-ratio:${aspect}">${cleaned}</div>`;
}

function formatBody(body) {
  if (!body) return '';

  // 1) extract iframes from trusted sources, replace with placeholder so they survive escaping
  const iframes = [];
  const PLACE = (i) => `__ENONEMBED${i}__`;
  let work = body.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, (m) => {
    const srcMatch = m.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (srcMatch && isSafeEmbedSrc(srcMatch[1])) {
      iframes.push(wrapIframe(m));
      return PLACE(iframes.length - 1);
    }
    return ''; // drop untrusted iframes
  });

  // 2) escape HTML for everything else
  let escaped = esc(work);

  // 3) detect URLs and wrap them as clickable links (open in new tab)
  const URL_RE = /(https?:\/\/[^\s<>"'、。「」（）\u3000-\u9FFF\uFF00-\uFFEF]+)/g;
  const linkified = escaped.replace(URL_RE, (m) => {
    const trailMatch = m.match(/[.,;:!?)）]+$/);
    let url = m;
    let trail = '';
    if (trailMatch) {
      trail = trailMatch[0];
      url = m.slice(0, -trail.length);
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${trail}`;
  });

  // 4) convert double newlines to paragraphs, single newlines to <br>
  const paragraphs = linkified.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`);
  let result = paragraphs.join('');

  // 5) restore iframes
  iframes.forEach((html, i) => {
    result = result.replace(PLACE(i), html);
  });

  // 6) cleanup: <p> cannot contain block-level <div>, so unwrap p>embed
  result = result.replace(/<p>\s*(<div class="news-embed"[\s\S]*?<\/div>)\s*<\/p>/gi, '$1');

  return result;
}

function renderNewsDetail(news, el) {
  if (!el) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const item = news.find(n => n.id === id);
  if (!item) {
    el.innerHTML = `
      <div class="news-detail news-detail--notfound">
        <p>該当するお知らせが見つかりませんでした。</p>
        <a class="news-detail__back" href="news.html">← News一覧に戻る</a>
      </div>`;
    document.title = 'お知らせが見つかりません | enon Official';
    return;
  }
  el.innerHTML = `
    <article class="news-detail">
      <a class="news-detail__back news-detail__back--top" href="news.html">← News一覧に戻る</a>
      <div class="news-detail__meta">
        <span class="news-detail__date">${esc(item.date)}</span>
        <span class="news-item__tag ${esc(item.category)}">${esc(categoryLabel(item.category))}</span>
      </div>
      <h1 class="news-detail__title">${esc(item.title)}</h1>
      ${item.image ? `<div class="news-detail__image"><img src="${esc(item.image)}" alt="${esc(item.title)}" loading="eager" decoding="async"></div>` : ''}
      <div class="news-detail__body">${formatBody(item.body)}</div>
      <a class="news-detail__back" href="news.html">← News一覧に戻る</a>
    </article>
  `;
  document.title = `${item.title} | enon Official`;
}

function categoryLabel(cat) {
  return ({ live:'Live', media:'Media', info:'Info', goods:'Goods' })[cat] || cat;
}

function scheduleTagsHTML(s) {
  const region = s.region ? `<span class="schedule-row__tag schedule-row__tag--region">${esc(s.region)}</span>` : '';
  const type = s.type ? `<span class="schedule-row__tag schedule-row__tag--type schedule-row__tag--${esc((s.type || '').toLowerCase())}">${esc(s.type)}</span>` : '';
  return region + type;
}

function scheduleRowHTML(s) {
  const detailUrl = s.id ? `schedule-detail.html?id=${encodeURIComponent(s.id)}` : 'schedule.html';
  return `<a class="schedule-row schedule-row--link" href="${esc(detailUrl)}">
    <div class="schedule-row__date">
      <span class="m">${esc(s.month)}</span>
      <span class="d">${esc(s.day)}</span>
      <span class="w">${esc(s.weekday)}</span>
    </div>
    <div class="schedule-row__body">
      <div class="schedule-row__tags">${scheduleTagsHTML(s)}</div>
      <div class="schedule-row__title">${esc(s.title)}</div>
      <div class="schedule-row__meta">${esc(s.meta || '')}</div>
    </div>
    <span class="schedule-row__cta ${s.ctaType ? esc(s.ctaType) : ''}">詳細 →</span>
  </a>`;
}

function renderScheduleList(schedule, el, limit) {
  if (!el) return;
  const items = limit ? schedule.slice(0, limit) : schedule;
  el.innerHTML = items.map(scheduleRowHTML).join('');
}

// ---------- Calendar rendering ----------
const _MONTH_TO_NUM = { JAN:0, FEB:1, MAR:2, APR:3, MAY:4, JUN:5, JUL:6, AUG:7, SEP:8, OCT:9, NOV:10, DEC:11 };
const _WEEKDAY_LABELS = ['日','月','火','水','木','金','土'];

function _eventDate(s) {
  const m = _MONTH_TO_NUM[(s.month || '').toUpperCase()];
  if (m === undefined) return null;
  const y = parseInt(s.year, 10);
  const d = parseInt(s.day, 10);
  if (!y || !d) return null;
  return new Date(y, m, d);
}

function _dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function renderScheduleCalendar(schedule, el) {
  if (!el) return;

  const eventsByDate = {};
  schedule.forEach(s => {
    const d = _eventDate(s);
    if (!d) return;
    const k = _dateKey(d);
    (eventsByDate[k] = eventsByDate[k] || []).push(s);
  });

  // determine starting view: nearest upcoming event, fallback to first event, fallback to today
  const today = new Date(); today.setHours(0,0,0,0);
  const allDates = schedule.map(_eventDate).filter(Boolean).sort((a,b) => a - b);
  const startFrom = allDates.find(d => d >= today) || allDates[0] || today;
  let viewYear = startFrom.getFullYear();
  let viewMonth = startFrom.getMonth();

  function build() {
    const first = new Date(viewYear, viewMonth, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];
    for (let i = startDow - 1; i >= 0; i--) {
      cells.push({ date: new Date(viewYear, viewMonth - 1, daysInPrev - i), outside: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ date: new Date(viewYear, viewMonth, i), outside: false });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last); next.setDate(last.getDate() + 1);
      cells.push({ date: next, outside: true });
    }
    // show 6 weeks for consistent height
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last); next.setDate(last.getDate() + 1);
      cells.push({ date: next, outside: true });
    }

    el.innerHTML = `
      <div class="schedule-cal">
        <div class="schedule-cal__head">
          <div class="schedule-cal__nav">
            <button class="schedule-cal__btn" data-cal-action="prev" aria-label="前月">‹</button>
            <button class="schedule-cal__btn" data-cal-action="next" aria-label="次月">›</button>
            <button class="schedule-cal__btn schedule-cal__btn--today" data-cal-action="today">今日</button>
          </div>
          <div class="schedule-cal__title">${viewYear}年 ${viewMonth + 1}月</div>
          <div class="schedule-cal__count">${allDates.filter(d => d.getFullYear() === viewYear && d.getMonth() === viewMonth).length}件</div>
        </div>
        <div class="schedule-cal__weekdays">
          ${_WEEKDAY_LABELS.map((w,i) => `<div class="schedule-cal__wd${i===0?' is-sun':''}${i===6?' is-sat':''}">${w}</div>`).join('')}
        </div>
        <div class="schedule-cal__grid">
          ${cells.map(c => {
            const dow = c.date.getDay();
            const isToday = c.date.getTime() === today.getTime();
            const k = _dateKey(c.date);
            const evs = eventsByDate[k] || [];
            const evHtml = evs.map(ev => {
              const detailHref = ev.id ? `schedule-detail.html?id=${encodeURIComponent(ev.id)}` : 'schedule.html';
              const typeClass = ev.type ? ` schedule-cal__event--${esc((ev.type || '').toLowerCase())}` : '';
              const debutClass = ev.ctaType === 'debut' ? ' is-debut' : '';
              const tagPrefix = ev.region ? `[${esc(ev.region)}] ` : '';
              return `<a class="schedule-cal__event${typeClass}${debutClass}" href="${esc(detailHref)}" title="${esc(ev.title)} — ${esc(ev.meta || '')}">${tagPrefix}${esc(ev.title)}</a>`;
            }).join('');
            return `<div class="schedule-cal__cell${c.outside ? ' is-outside' : ''}${isToday ? ' is-today' : ''}${dow===0?' is-sun':''}${dow===6?' is-sat':''}">
              <div class="schedule-cal__date">${c.date.getDate()}</div>
              <div class="schedule-cal__events">${evHtml}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    el.querySelectorAll('[data-cal-action]').forEach(b => {
      b.onclick = () => {
        const a = b.dataset.calAction;
        if (a === 'prev') {
          viewMonth--;
          if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        } else if (a === 'next') {
          viewMonth++;
          if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        } else if (a === 'today') {
          viewYear = today.getFullYear();
          viewMonth = today.getMonth();
        }
        build();
      };
    });
  }

  build();
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
        ${byMonth[k].map(scheduleRowHTML).join('')}
      </div>
    `;
  }).join('');
}

function renderScheduleDetail(schedule, el) {
  if (!el) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const item = schedule.find(s => s.id === id);
  if (!item) {
    el.innerHTML = `
      <div class="news-detail news-detail--notfound">
        <p>該当する予定が見つかりませんでした。</p>
        <a class="news-detail__back" href="schedule.html">← Schedule一覧に戻る</a>
      </div>`;
    document.title = '予定が見つかりません | enon Official';
    return;
  }
  const monthFull = { JAN:'JANUARY',FEB:'FEBRUARY',MAR:'MARCH',APR:'APRIL',MAY:'MAY',JUN:'JUNE',JUL:'JULY',AUG:'AUGUST',SEP:'SEPTEMBER',OCT:'OCTOBER',NOV:'NOVEMBER',DEC:'DECEMBER' }[item.month] || item.month;
  const tags = scheduleTagsHTML(item);
  const cta = (item.url && item.url !== '#') ? `
    <div class="schedule-detail__cta-wrap">
      <a class="schedule-detail__cta${item.ctaType === 'debut' ? ' is-debut' : ''}" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.ctaLabel || 'Ticket')} →</a>
    </div>` : '';
  el.innerHTML = `
    <article class="news-detail schedule-detail">
      <a class="news-detail__back news-detail__back--top" href="schedule.html">← Schedule一覧に戻る</a>
      <div class="schedule-detail__date">
        <div class="schedule-detail__date-monthyear">${esc(item.year)} / ${esc(monthFull)}</div>
        <div class="schedule-detail__date-big">${esc(item.day)} <small>(${esc(item.weekday)})</small></div>
      </div>
      <div class="schedule-detail__tags">${tags}</div>
      <h1 class="news-detail__title">${esc(item.title)}</h1>
      ${item.meta ? `<div class="schedule-detail__meta">${esc(item.meta)}</div>` : ''}
      ${item.image ? `<div class="news-detail__image"><img src="${esc(item.image)}" alt="${esc(item.title)}" loading="eager" decoding="async"></div>` : ''}
      ${item.body ? `<div class="news-detail__body">${formatBody(item.body)}</div>` : ''}
      ${cta}
      <a class="news-detail__back" href="schedule.html">← Schedule一覧に戻る</a>
    </article>
  `;
  document.title = `${item.title} | enon Official`;
}

function renderGallery(gallery, el) {
  if (!el) return;
  el.innerHTML = gallery.map(g => {
    const label = esc(g.label || '');
    if (g.image) {
      return `<div class="gallery-cell gallery-cell--image" data-label="${label}">
        <img src="${esc(g.image)}" alt="${label}" loading="lazy" decoding="async">
      </div>`;
    }
    return `<div class="gallery-cell gallery-cell--${esc(g.color || 'c1')}" data-label="${label}"></div>`;
  }).join('');
}

function renderSns(sns, el) {
  if (!el) return;
  el.innerHTML = sns.map(s => {
    const url = s.url || '#';
    const external = /^https?:\/\//.test(url);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    // if type is set and recognized, render icon + label; otherwise fallback to label-only
    if (s.type && SNS_ICONS[s.type]) {
      const label = s.label || SNS_LABEL[s.type] || s.type;
      return `<a class="sns-link sns-link--icon" href="${esc(url)}"${attrs} aria-label="${esc(label)}">
        <span class="sns-link__icon">${SNS_ICONS[s.type]}</span>
        <span class="sns-link__label">${esc(label)}</span>
      </a>`;
    }
    return `<a class="sns-link" href="${esc(url)}"${attrs}>${esc(s.label || url)}</a>`;
  }).join('');
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
  renderScheduleCalendar(data.schedule, document.querySelector('[data-slot="scheduleCalendar"]'));
  renderGallery(data.gallery, document.querySelector('[data-slot="gallery"]'));
  renderSns(data.sns, document.querySelector('[data-slot="sns"]'));

  // Members page
  renderMemberDetails(data.members, document.querySelector('[data-slot="memberDetails"]'));
  // Members page: group section + filter chips (Group / Member)
  const _groupSlot = document.querySelector('[data-slot="groupSection"]');
  const _memberSlot = document.querySelector('[data-slot="memberDetails"]');
  const _filterSlot = document.querySelector('[data-slot="artistFilter"]');
  renderGroupSection(data.group, _groupSlot);
  renderArtistFilter(data, _filterSlot, _groupSlot, _memberSlot);

  // News page
  renderNewsList(data.news, document.querySelector('[data-slot="newsFull"]'));
  initNewsFilter();

  // News detail page
  renderNewsDetail(data.news, document.querySelector('[data-slot="newsDetail"]'));

  // Schedule page
  renderScheduleGrouped(data.schedule, document.querySelector('[data-slot="scheduleFull"]'));

  // Schedule detail page
  renderScheduleDetail(data.schedule, document.querySelector('[data-slot="scheduleDetail"]'));

  // After render: init scroll reveals for all dynamic items
  initReveal('.section__head, .member-card, .schedule-row, .news-item, .member-detail, .gallery-cell, .sns-link, .pagehead__inner');

  // handle hash scroll after members render
  if (location.hash) {
    setTimeout(() => {
      const tgt = document.querySelector(location.hash);
      if (tgt) tgt.scrollIntoView({ behavior:'smooth', block:'start' });
    }, 100);
  }
});
