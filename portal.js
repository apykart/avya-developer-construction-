/* portal.js — shared by admin.html and associate.html (needs firebase-config.js + db.js first) */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fd = t => t && t.toDate ? t.toDate().toLocaleDateString('en-IN') : (t || '—');
const bd = s => { s = s || 'new'; return `<span class="bd ${esc(String(s).split(' ')[0])}">${esc(s)}</span>`; };
const TS = () => firebase.firestore.FieldValue.serverTimestamp();
const STATUSES = ['new', 'contacted', 'interested', 'site visit scheduled', 'visited', 'negotiation', 'booked', 'lost'];
const LF = [['name', 'Name *'], ['phone', 'Phone', 'tel'], ['email', 'Email', 'email'], ['project', 'Project'], ['budget', 'Budget'],
  ['status', 'Status', 'select', STATUSES], ['followUp', 'Next follow-up', 'date'], ['notes', 'Notes', 'area']];
let DATA = [], unsubs = [];

function toast(m) { const t = document.createElement('div'); t.id = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); }
function tbl(cols, rows) {
  return `<div class="tw"><table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${
    rows.length ? rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}">No data yet</td></tr>`}</tbody></table></div>`;
}
function closeModal() { const m = $('modal'); if (m) m.remove(); }
function modal(h) { closeModal(); const m = document.createElement('div'); m.id = 'modal'; m.innerHTML = `<div>${h}</div>`; m.onclick = e => { if (e.target === m) closeModal(); }; document.body.appendChild(m); }
function sub(q, cb) { unsubs.push(q.onSnapshot(s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => toast(e.message))); }
function clearSubs() { unsubs.forEach(u => u()); unsubs = []; }

// form(fields, values) -> html ; val(fields) -> object ; fields = [key,label,type,options]
function form(fs, v = {}) {
  return `<div class="g2">${fs.map(([k, l, t, o]) => `<label>${l}${
    t === 'select' ? `<select id="f_${k}">${o.map(x => { const [a, b] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(a)}" ${v[k] == a ? 'selected' : ''}>${esc(b)}</option>`; }).join('')}</select>`
    : t === 'area' ? `<textarea id="f_${k}" rows="3">${esc(v[k])}</textarea>`
    : `<input id="f_${k}" type="${t || 'text'}" value="${esc(v[k])}">`}</label>`).join('')}</div>`;
}
const val = fs => Object.fromEntries(fs.map(([k]) => [k, $('f_' + k).value.trim()]));
async function up(id) { const f = $(id) && $(id).files[0]; if (!f) return null; toast('Uploading image...'); return uploadToCloudinary(f); }

// Generic real-time list with add/edit/delete. o: {col,title,q,cols,row,fields,base,req,add,del,extra}
function crud(m, o) {
  m.innerHTML = `<h3>${o.title}s</h3>${o.add === false ? '' : `<button class="btn" id="addb">+ Add ${o.title}</button>`}<div id="list"></div>`;
  const edit = (d = {}) => {
    modal(`<h3>${d.id ? 'Edit' : 'Add'} ${o.title}</h3>${form(o.fields, d)}<button class="btn" id="sv">Save</button>`);
    $('sv').onclick = async () => {
      const v = val(o.fields);
      if (o.req && !v[o.req]) return toast('Please fill the required field');
      try {
        if (d.id) await db.collection(o.col).doc(d.id).update(v);
        else await db.collection(o.col).add({ ...v, ...(o.base || {}), createdAt: TS() });
        closeModal(); toast('Saved');
      } catch (e) { toast(e.message); }
    };
  };
  window._e = id => edit(DATA.find(x => x.id == id));
  window._d = async id => { if (confirm('Delete this record?')) { try { await db.collection(o.col).doc(id).delete(); } catch (e) { toast(e.message); } } };
  if ($('addb')) $('addb').onclick = () => edit();
  sub(o.q || db.collection(o.col), a => {
    DATA = a;
    $('list').innerHTML = tbl([...o.cols, ''], a.map(d => [...o.row(d),
      `<button class="btn s o" onclick="_e('${d.id}')">Edit</button>${o.del ? ` <button class="btn s o" onclick="_d('${d.id}')">Delete</button>` : ''}${o.extra ? ' ' + o.extra(d) : ''}`]));
  });
}

// Auth boot: role = 'admin' | 'manager'. Manager must also be status 'active'.
const showApp = on => { $('login').classList.toggle('hide', on); $('app').classList.toggle('hide', !on); if (!on) { clearSubs(); closeModal(); if (window.onOut) window.onOut(); } };
function boot(role, start) {
  auth.onAuthStateChanged(async u => {
    if (!u) return showApp(false);
    try {
      const r = await DB.getUserRole(u.uid);
      if (!r || r.role !== role) throw Error('This account cannot open this panel.');
      let mgr = null;
      if (role === 'manager') {
        mgr = await DB.getManager(r.managerId);
        if (!mgr || mgr.status !== 'active') throw Error('Your account is not active. Please contact the admin.');
      }
      showApp(true); start(u, r, mgr);
    } catch (e) { await auth.signOut(); $('lerr').textContent = e.message; }
  });
  $('lform').onsubmit = async e => {
    e.preventDefault(); $('lerr').textContent = '';
    try { await auth.signInWithEmailAndPassword($('lemail').value.trim(), $('lpass').value); }
    catch (x) { $('lerr').textContent = 'Wrong email or password.'; }
  };
}
function go(items, k) { clearSubs(); document.querySelectorAll('nav a[data-k]').forEach(a => a.classList.toggle('on', a.dataset.k == k)); items[k]($('main')); }
function mkNav(items, name) {
  $('nav').innerHTML = `<h3>${name}</h3>` + Object.keys(items).map(k => `<a data-k="${k}">${k}</a>`).join('') + `<a onclick="auth.signOut()">Logout</a>`;
  $('nav').onclick = e => { if (e.target.dataset.k) go(items, e.target.dataset.k); };
  go(items, Object.keys(items)[0]);
}
