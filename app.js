/* ============================================================
 * 暴富专属工作台  v1.0
 * 数据全部留存于 localStorage，按日期隔离
 * ============================================================ */

const KEY = 'baofu_workbench_v1';
const EX_CATS = ['餐饮', '交通', '购物', '娱乐', '居住', '其他'];
const QUICK_EX = [
  { type: '跑步', icon: '🏃' },
  { type: '俯卧撑', icon: '💪' },
  { type: '深蹲', icon: '🦵' },
  { type: '平板支撑', icon: '🧘' },
  { type: '跳绳', icon: '🤾' },
  { type: '瑜伽', icon: '🌿' },
];

/* ---------- 状态 ---------- */
let state = load();
let view = 'plan';
let planDate = todayStr();
let expMonth = monthStr();
let expFilter = null; // 'YYYY-MM-DD' 或 null

/* ---------- 工具函数 ---------- */
function blank() {
  return { plans: {}, expenses: [], inspirations: [], exercises: [], readings: [] };
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (!d) return blank();
    return Object.assign(blank(), d);
  } catch (e) { return blank(); }
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function fmt(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function todayStr() { return fmt(new Date()); }
function monthStr(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
function addDays(s, n) { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return fmt(d); }
function shiftMonth(s, n) {
  const [y, m] = s.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1);
}
function weekday(s) {
  const d = new Date(s + 'T00:00:00');
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
}
function fmtTime(ts) {
  const d = new Date(ts);
  return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function daysInMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}
function daysElapsed(ym) {
  const [y, m] = ym.split('-').map(Number);
  const now = new Date();
  const last = new Date(y, m, 0).getDate();
  if (y === now.getFullYear() && m === now.getMonth() + 1) return Math.min(now.getDate(), last);
  return last;
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ---------- 渲染调度 ---------- */
const TITLES = { plan: '每日计划', expense: '每日花费', idea: '灵感记录', exercise: '锻炼身体', reading: '每日阅读', sleep: '睡眠闹钟' };

function setView(v) {
  if (sleepTimer) { clearInterval(sleepTimer); sleepTimer = null; }
  view = v;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  document.getElementById('viewTitle').textContent = TITLES[v];
  document.getElementById('topDate').textContent = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
  render();
  if (v === 'sleep') startSleepCount();
}
function render() {
  const el = document.getElementById('view');
  if (view === 'plan') el.innerHTML = renderPlan();
  else if (view === 'expense') el.innerHTML = renderExpense();
  else if (view === 'idea') el.innerHTML = renderIdea();
  else if (view === 'exercise') el.innerHTML = renderExercise();
  else if (view === 'reading') el.innerHTML = renderReading();
  else if (view === 'sleep') el.innerHTML = renderSleep();
}

/* ---------- 1. 每日计划 ---------- */
function renderPlan() {
  const isToday = planDate === todayStr();
  const items = state.plans[planDate] || [];
  const total = items.length;
  const done = items.filter(i => i.done).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  const circ = 2 * Math.PI * 54;
  const offset = circ * (1 - pct / 100);

  let html = `
    <div class="card">
      <div class="switcher">
        <div class="seg">
          <button class="arrow-btn" onclick="prevPlan()">‹</button>
          <div class="switch-label">${planDate.slice(5)}<small>${weekday(planDate)}</small></div>
          <button class="arrow-btn" onclick="nextPlan()">›</button>
        </div>
        <button class="today-btn" onclick="goToday()">今天</button>
      </div>
      ${isToday ? '' : '<div class="ro-badge">🔒 只读 · 历史日期</div>'}

      <div class="ring-wrap">
        <svg width="132" height="132" viewBox="0 0 132 132">
          <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#7C5CFC"/><stop offset="100%" stop-color="#4ad7d9"/>
          </linearGradient></defs>
          <circle class="ring-bg" cx="66" cy="66" r="54"></circle>
          <circle class="ring-fg" cx="66" cy="66" r="54"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="ring-center">
          <div class="ring-pct">${pct}%</div>
          <div class="ring-sub">${done}/${total} 完成</div>
        </div>
      </div>

      ${isToday ? `
      <div class="field">
        <input id="planInput" placeholder="今天要做什么？" onkeydown="if(event.key==='Enter')addPlan()" />
        <button class="btn" onclick="addPlan()">添加</button>
      </div>` : ''}

      <ul class="list">
        ${items.map(i => `
          <li class="item ${i.done ? 'done' : ''}">
            <button class="check ${i.done ? 'on' : ''}" ${isToday ? `onclick="togglePlan('${i.id}')"` : 'disabled'}>${i.done ? '✓' : ''}</button>
            <div class="body"><div class="title">${esc(i.text)}</div></div>
            ${isToday ? `<button class="del" onclick="delPlan('${i.id}')">🗑</button>` : ''}
          </li>`).join('')}
      </ul>
      ${total === 0 ? '<div class="empty">还没有计划，加一条吧 ✨</div>' : ''}
    </div>`;
  return html;
}
function prevPlan() { planDate = addDays(planDate, -1); render(); }
function nextPlan() { planDate = addDays(planDate, 1); render(); }
function goToday() { planDate = todayStr(); render(); }
function addPlan() {
  const inp = document.getElementById('planInput');
  const t = inp.value.trim();
  if (!t) return;
  if (!state.plans[planDate]) state.plans[planDate] = [];
  state.plans[planDate].push({ id: uid(), text: t, done: false });
  save(); render();
}
function togglePlan(id) {
  const arr = state.plans[planDate] || [];
  const it = arr.find(i => i.id === id);
  if (it) { it.done = !it.done; save(); render(); }
}
function delPlan(id) {
  state.plans[planDate] = (state.plans[planDate] || []).filter(i => i.id !== id);
  save(); render();
}

/* ---------- 2. 每日花费 ---------- */
function renderExpense() {
  const list = state.expenses.filter(e => e.date.slice(0, 7) === expMonth);
  const shown = expFilter ? list.filter(e => e.date === expFilter) : list;
  const total = shown.reduce((s, e) => s + e.amount, 0);
  const count = shown.length;
  const avg = (expFilter ? (count ? total / count : 0) : (list.length ? total / daysElapsed(expMonth) : 0));

  let html = `
    <div class="card">
      <div class="switcher">
        <div class="seg">
          <button class="arrow-btn" onclick="prevMonth()">‹</button>
          <div class="switch-label">${expMonth}<small>${expFilter ? '筛选中' : '本月'}</small></div>
          <button class="arrow-btn" onclick="nextMonth()">›</button>
        </div>
        <button class="today-btn" onclick="goMonth()">本月</button>
      </div>

      <div class="stats">
        <div class="stat"><div class="v">¥${total.toFixed(0)}</div><div class="k">${expFilter ? '当日累计' : '月度累计'}</div></div>
        <div class="stat"><div class="v">${count}</div><div class="k">笔数</div></div>
        <div class="stat"><div class="v">¥${avg.toFixed(1)}</div><div class="k">${expFilter ? '单笔均' : '日均'}</div></div>
      </div>

      <div class="field" style="margin:14px 0 4px">
        <input type="date" id="expFilter" value="${expFilter || ''}" onchange="setExpFilter(this.value)" />
        <button class="btn ghost sm" onclick="clearExpFilter()">全部</button>
      </div>

      <div class="field" style="margin-top:12px">
        <input id="expAmt" type="number" inputmode="decimal" placeholder="金额 ¥" style="max-width:110px" />
        <select id="expCat">${EX_CATS.map(c => `<option>${c}</option>`).join('')}</select>
        <input id="expNote" placeholder="备注（可选）" />
        <button class="btn" onclick="addExpense()">记一笔</button>
      </div>

      <ul class="list">
        ${shown.slice().reverse().map(e => `
          <li class="item">
            <span class="exp-cat">${esc(e.category)}</span>
            <div class="body">
              <div class="title">${esc(e.note || e.category)}</div>
              <div class="meta">${e.date.slice(5)} · ¥${e.amount.toFixed(2)}</div>
            </div>
            <button class="del" onclick="delExpense('${e.id}')">🗑</button>
          </li>`).join('')}
      </ul>
      ${shown.length === 0 ? '<div class="empty">本月还没有花费记录</div>' : ''}
    </div>`;
  return html;
}
function prevMonth() { expMonth = shiftMonth(expMonth, -1); expFilter = null; render(); }
function nextMonth() { expMonth = shiftMonth(expMonth, 1); expFilter = null; render(); }
function goMonth() { expMonth = monthStr(); expFilter = null; render(); }
function setExpFilter(v) { expFilter = v || null; render(); }
function clearExpFilter() { expFilter = null; render(); }
function addExpense() {
  const amt = parseFloat(document.getElementById('expAmt').value);
  if (!(amt > 0)) { toast('请输入有效金额'); return; }
  const category = document.getElementById('expCat').value;
  const note = document.getElementById('expNote').value.trim();
  state.expenses.push({ id: uid(), date: todayStr(), amount: amt, category, note });
  save(); render();
  toast('已记录一笔花费');
}
function delExpense(id) { state.expenses = state.expenses.filter(e => e.id !== id); save(); render(); }

/* ---------- 3. 灵感记录 ---------- */
function renderIdea() {
  const list = state.inspirations.slice().reverse();
  let html = `
    <div class="card">
      <div class="card-title">💡 灵感记录 <span class="card-sub">· 累积留存，不按日清零</span></div>
      <div class="field">
        <textarea id="ideaInput" placeholder="突然冒出的好点子…"></textarea>
        <button class="btn" onclick="addIdea()">记下</button>
      </div>
      <ul class="list">
        ${list.map(i => `
          <li class="item">
            <div class="body">
              <div class="title">${esc(i.text)}</div>
              <div class="meta">${fmtTime(i.ts)}</div>
            </div>
            <button class="del" onclick="delIdea('${i.id}')">🗑</button>
          </li>`).join('')}
      </ul>
      ${list.length === 0 ? '<div class="empty">灵感库还是空的，记录第一条吧</div>' : ''}
    </div>`;
  return html;
}
function addIdea() {
  const inp = document.getElementById('ideaInput');
  const t = inp.value.trim();
  if (!t) return;
  state.inspirations.push({ id: uid(), ts: Date.now(), text: t });
  save(); render();
}
function delIdea(id) { state.inspirations = state.inspirations.filter(i => i.id !== id); save(); render(); }

/* ---------- 4. 锻炼身体 ---------- */
function renderExercise() {
  const list = state.exercises.slice().reverse();
  let html = `
    <div class="card">
      <div class="card-title">🏃 锻炼身体 <span class="card-sub">· 快捷记录，累积统计</span></div>
      <div class="quick">
        ${QUICK_EX.map(q => `<button onclick="quickEx('${q.type}')"><span class="qi">${q.icon}</span>${q.type}</button>`).join('')}
      </div>
      <div class="card-title" style="margin-top:6px">自定义记录</div>
      <div class="field">
        <input id="exType" placeholder="运动类型" style="max-width:130px" />
        <input id="exDur" type="number" inputmode="numeric" placeholder="时长(分钟)" style="max-width:120px" />
        <input id="exNote" placeholder="备注（可选）" />
        <button class="btn" onclick="addExercise()">添加</button>
      </div>
      <ul class="list">
        ${list.map(e => `
          <li class="item">
            <div class="body">
              <div class="title"><span class="tag">${esc(e.type)}</span>${e.duration ? e.duration + ' 分钟' : ''}</div>
              <div class="meta">${fmtTime(e.ts)}${e.note ? ' · ' + esc(e.note) : ''}</div>
            </div>
            <button class="del" onclick="delExercise('${e.id}')">🗑</button>
          </li>`).join('')}
      </ul>
      ${list.length === 0 ? '<div class="empty">动起来！点上面的快捷按钮开始</div>' : ''}
    </div>`;
  return html;
}
function quickEx(type) {
  state.exercises.push({ id: uid(), ts: Date.now(), type, duration: 15, note: '' });
  save(); render();
  toast('已记录 ' + type + ' 15 分钟');
}
function addExercise() {
  const type = document.getElementById('exType').value.trim();
  const dur = parseInt(document.getElementById('exDur').value, 10);
  const note = document.getElementById('exNote').value.trim();
  if (!type) { toast('请填写运动类型'); return; }
  state.exercises.push({ id: uid(), ts: Date.now(), type, duration: isNaN(dur) ? 0 : dur, note });
  save(); render();
}
function delExercise(id) { state.exercises = state.exercises.filter(e => e.id !== id); save(); render(); }

/* ---------- 5. 每日阅读 ---------- */
function renderReading() {
  const list = state.readings.slice().reverse();
  let html = `
    <div class="card">
      <div class="card-title">📖 每日阅读 <span class="card-sub">· 读过的书，累积留存</span></div>
      <div class="field">
        <input id="rdTitle" placeholder="书名" style="flex:2 1 140px" />
        <input id="rdAuthor" placeholder="作者" style="flex:1 1 90px" />
      </div>
      <div class="field" style="margin-top:10px">
        <input id="rdPages" type="number" inputmode="numeric" placeholder="页数" style="max-width:100px" />
        <input id="rdNote" placeholder="笔记 / 感想（可选）" style="flex:1" />
        <button class="btn" onclick="addReading()">记录</button>
      </div>
      <ul class="list">
        ${list.map(r => `
          <li class="item">
            <div class="body">
              <div class="title">${esc(r.title)}<span class="card-sub"> ${esc(r.author || '')}</span></div>
              <div class="meta">${r.pages ? r.pages + ' 页 · ' : ''}${fmtTime(r.ts)}${r.note ? ' · ' + esc(r.note) : ''}</div>
            </div>
            <button class="del" onclick="delReading('${r.id}')">🗑</button>
          </li>`).join('')}
      </ul>
      ${list.length === 0 ? '<div class="empty">还没有阅读记录，今天读点什么？</div>' : ''}
    </div>`;
  return html;
}
function addReading() {
  const title = document.getElementById('rdTitle').value.trim();
  if (!title) { toast('请填写书名'); return; }
  const author = document.getElementById('rdAuthor').value.trim();
  const pages = parseInt(document.getElementById('rdPages').value, 10);
  const note = document.getElementById('rdNote').value.trim();
  state.readings.push({ id: uid(), ts: Date.now(), title, author, pages: isNaN(pages) ? 0 : pages, note });
  save(); render();
}
function delReading(id) { state.readings = state.readings.filter(r => r.id !== id); save(); render(); }

/* ---------- 6. 睡眠闹钟（90 分钟周期法）---------- */
const SLEEP_KEY = 'baofu_sleep_alarm_v1';
const CYCLE_MIN = 90;
const FALL_ASLEEP_MIN = 15; // 入睡缓冲
let sleepTimer = null;
let alarmTimeout = null;
let alarmFired = false;

function renderSleep() {
  const now = new Date();
  const rows = [];
  for (let n = 1; n <= 10; n++) {
    const wake = new Date(now.getTime() + n * CYCLE_MIN * 60000 + FALL_ASLEEP_MIN * 60000);
    rows.push({ n, wake });
  }
  const alarm = loadSleepAlarm();
  const def = rows[4]; // 默认第 5 周期（约 7.5h，黄金组合）
  const listHtml = rows.map(r => {
    const sel = alarm && Math.abs(new Date(alarm.targetTs).getTime() - r.wake.getTime()) < 60000;
    const diff = r.wake - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.round((diff % 3600000) / 60000);
    const hh = r.wake.getHours(), mm = r.wake.getMinutes();
    return `
      <li class="item sleep-row ${sel ? 'sel' : ''}" onclick="jumpToPhoneAlarm(${hh}, ${mm}, ${r.n})">
        <div class="sleep-cyc">${r.n}<small>周期</small></div>
        <div class="body">
          <div class="title">${pad(hh)}:${pad(mm)}</div>
          <div class="meta">约 ${h > 0 ? h + ' 小时 ' : ''}${m} 分钟后醒</div>
        </div>
        <button class="btn ghost xs" onclick="event.stopPropagation(); setSleepAlarm(${r.wake.getTime()}, ${r.n})">🔔网页</button>
        ${sel ? '<span class="sleep-pick">✓ 已设</span>' : '<span class="sleep-pick ghost">设手机闹钟</span>'}
      </li>`;
  }).join('');

  const alarmHtml = alarm ? renderAlarmCard(alarm) : '';

  return `
    <div class="card">
      <div class="card-title">⏰ 睡眠闹钟 <span class="card-sub">· 90 分钟周期法</span></div>
      <div class="sleep-note">以当前时间 <b>${pad(now.getHours())}:${pad(now.getMinutes())}</b> 为起点，每个周期 90 分钟，并加约 15 分钟入睡缓冲。点任意一行直接跳去设手机闹钟。</div>
      <div class="sleep-jump">
        <button class="btn primary sm" onclick="jumpToPhoneAlarm(${def.wake.getHours()}, ${def.wake.getMinutes()}, 5)">📱 一键跳到手机闹钟（第5周期）</button>
        <button class="btn ghost sm" onclick="openClockApp()">打开手机闹钟 App</button>
      </div>
      <div class="sleep-tip">Android：直接带入时间跳进闹钟页；iPhone：自动复制时间，去「时钟 → 闹钟 → +」粘贴即可。</div>
      <button class="btn ghost sm" style="margin:4px 0" onclick="requestNotify()">🔔 开启网页通知权限</button>
      <div class="sleep-warn">⚠️ 网页提醒需保持本页 / 已装 App 后台运行才响；重要起床请用手机自带闹钟最稳。</div>
    </div>
    ${alarmHtml}
    <div class="card">
      <div class="card-title">选择醒来时间（第 1–10 周期）</div>
      <ul class="list">${listHtml}</ul>
    </div>`;
}

/* 跳转到手机自带闹钟：Android 用 SET_ALARM 意图带入时间，iPhone 复制时间并提示 */
async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); return true; }
  catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.top = '-9999px'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      const ok = document.execCommand('copy'); document.body.removeChild(ta); return ok;
    } catch (e2) { return false; }
  }
}
function isAndroid() { return /Android/i.test(navigator.userAgent || ''); }
function jumpToPhoneAlarm(h, m, n) {
  const timeStr = pad(h) + ':' + pad(m);
  copyText(timeStr);
  if (isAndroid()) {
    toast('已复制 ' + timeStr + '，正在打开手机闹钟…');
    // SET_ALARM 是 Android 标准意图，可带入小时/分钟/振动/标签，跳进闹钟页
    const intent = 'intent://#Intent;action=android.intent.action.SET_ALARM;' +
      'i.android.intent.extra.alarm.HOUR=' + h + ';' +
      'i.android.intent.extra.alarm.MINUTES=' + m + ';' +
      'B.android.intent.extra.alarm.VIBRATE=true;' +
      'S.android.intent.extra.alarm.MESSAGE=' + encodeURIComponent('暴富起床') + ';end';
    setTimeout(() => { window.location.href = intent; }, 350);
  } else {
    toast('已复制 ' + timeStr + ' ✓ 打开「时钟」→ 闹钟 → 点 + → 填入/粘贴');
  }
}
function openClockApp() {
  if (isAndroid()) {
    toast('正在打开手机闹钟列表…');
    window.location.href = 'intent://#Intent;action=android.intent.action.SHOW_ALARMS;end';
  } else {
    toast('iPhone 请手动打开「时钟」App → 闹钟 → 点 +');
  }
}

function renderAlarmCard(alarm) {
  const t = new Date(alarm.targetTs);
  return `
    <div class="card sleep-alarm">
      <div class="card-title">🔔 已设闹钟</div>
      <div class="sleep-big">${pad(t.getHours())}:${pad(t.getMinutes())}</div>
      <div class="sleep-count" id="sleepCount">计算中…</div>
      <div class="sleep-cyc-tag">第 ${alarm.cycleN} 周期 · 约 ${alarm.cycleN * CYCLE_MIN + FALL_ASLEEP_MIN} 分钟睡眠</div>
      <button class="btn ghost sm" onclick="cancelSleepAlarm()">取消闹钟</button>
    </div>`;
}

function loadSleepAlarm() {
  try { return JSON.parse(localStorage.getItem(SLEEP_KEY)); } catch (e) { return null; }
}
function startSleepCount() {
  updateSleepCount();
  if (sleepTimer) clearInterval(sleepTimer);
  sleepTimer = setInterval(updateSleepCount, 1000);
}
function updateSleepCount() {
  const el = document.getElementById('sleepCount');
  if (!el) return;
  const alarm = loadSleepAlarm();
  if (!alarm) { el.textContent = ''; return; }
  const diff = new Date(alarm.targetTs).getTime() - Date.now();
  if (diff <= 0) {
    el.textContent = '⏰ 时间到！';
    if (!alarmFired) { alarmFired = true; ringAlarm(); }
    return;
  }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  el.textContent = `还剩 ${h > 0 ? h + ' 小时 ' : ''}${m} 分 ${s} 秒`;
}
function setSleepAlarm(ts, n) {
  alarmFired = false;
  localStorage.setItem(SLEEP_KEY, JSON.stringify({ targetTs: ts, cycleN: n, setAt: Date.now() }));
  requestNotify(true);
  ensureWakeCheck();
  render();
  const t = new Date(ts);
  toast('已设闹钟：' + pad(t.getHours()) + ':' + pad(t.getMinutes()) + '（第' + n + '周期）');
}
function cancelSleepAlarm() {
  localStorage.removeItem(SLEEP_KEY);
  alarmFired = false;
  if (alarmTimeout) { clearTimeout(alarmTimeout); alarmTimeout = null; }
  if (sleepTimer) { clearInterval(sleepTimer); sleepTimer = null; }
  render();
  toast('已取消闹钟');
}
function ensureWakeCheck() {
  if (alarmTimeout) clearTimeout(alarmTimeout);
  const alarm = loadSleepAlarm();
  if (!alarm) return;
  const diff = new Date(alarm.targetTs).getTime() - Date.now();
  if (diff <= 0) { if (!alarmFired) { alarmFired = true; ringAlarm(); } return; }
  alarmTimeout = setTimeout(() => { if (!alarmFired) { alarmFired = true; ringAlarm(); } }, diff);
}
function ringAlarm() {
  const a = loadSleepAlarm();
  const n = a ? a.cycleN : '';
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('⏰ 暴富起床啦', { body: '第' + n + '个周期结束，现在醒最清爽～', tag: 'baofu-sleep', requireInteraction: true });
    } catch (e) {}
  }
  if (navigator.vibrate) { try { navigator.vibrate([400, 200, 400, 200, 400, 200, 400]); } catch (e) {} }
  playBeep();
  toast('⏰ 闹钟时间到！');
}
function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume();
    const beep = (freq, start, dur) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur);
    };
    beep(880, 0, 0.5); beep(880, 0.6, 0.5); beep(1046, 1.2, 0.6);
  } catch (e) {}
}
function requestNotify(silent) {
  if (!('Notification' in window)) { if (!silent) toast('此浏览器不支持通知'); return; }
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(p => { if (!silent) toast(p === 'granted' ? '通知已开启' : '通知被拒绝'); });
  } else if (!silent) {
    toast(Notification.permission === 'granted' ? '通知已开启' : '通知被拒绝，请在浏览器设置里允许');
  }
}

/* ---------- 底部：重置今日 ---------- */
function resetToday() {
  if (!confirm('确定清空「今日计划」吗？\n仅清除今天的待办，其他数据不受影响，且不可撤销。')) return;
  state.plans[todayStr()] = [];
  save();
  if (view === 'plan') { planDate = todayStr(); render(); }
  toast('今日计划已重置');
}

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ---------- 登录门 ---------- */
const PASSWORD = 'baofu2026';           // 想改密码：直接改这个值，重新部署即可
const AUTH_KEY = 'baofu_auth_v1';
const AUTH_DAYS = 7;
function isAuthed() {
  try {
    const a = JSON.parse(localStorage.getItem(AUTH_KEY));
    return a && a.ok && a.exp > Date.now();
  } catch (e) { return false; }
}
function doLogin() {
  const inp = document.getElementById('loginPwd');
  if (inp.value !== PASSWORD) {
    inp.classList.add('shake');
    inp.value = '';
    setTimeout(() => inp.classList.remove('shake'), 350);
    toast('密码不正确');
    return;
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify({
    ok: true,
    exp: Date.now() + AUTH_DAYS * 24 * 60 * 60 * 1000
  }));
  document.getElementById('loginMask').classList.remove('show');
  inp.value = '';
}
function logout() {
  localStorage.removeItem(AUTH_KEY);
  document.getElementById('loginMask').classList.add('show');
}

/* ---------- PWA 注册（可“添加到主屏幕”）---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

/* ---------- 启动 ---------- */
if (isAuthed()) {
  document.getElementById('loginMask').classList.remove('show');
} else {
  document.getElementById('loginMask').classList.add('show');
}
setView('plan');
