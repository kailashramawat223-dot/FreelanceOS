// FreelanceOS - zero-dependency Node server (http + JSON file DB). Node >= 18.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET || 'freelanceos-sphinx26-dev-secret';
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'data', 'db.json');
const DAY = 864e5;
const uid = p => p + '_' + crypto.randomBytes(4).toString('hex');
const iso = off => new Date(Date.now() + off * DAY).toISOString().slice(0, 10);
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const err = (status, error) => Object.assign(new Error(error), { status });

/* ---------- DB ---------- */
let db;
const save = () => { try { fs.mkdirSync(path.dirname(DB_FILE), { recursive: true }); const t = DB_FILE + '.tmp'; fs.writeFileSync(t, JSON.stringify(db)); fs.renameSync(t, DB_FILE); } catch (e) { /* read-only FS: stay in memory */ } };
const act = text => { db.activity.unshift({ id: uid('a'), text, at: Date.now() }); db.activity = db.activity.slice(0, 40); };
const T = l => l.map(([title, status]) => ({ id: uid('t'), title, status }));

function seed() {
  const c = [
    { id: 'c_meera', name: 'Meera Kapoor', email: 'meera.kapoor@novatech.io', phone: '919876500001', company: 'NovaTech', token: 'meera-demo' },
    { id: 'c_vikram', name: 'Vikram Desai', email: 'vikram@greenleaf.co.in', phone: '919876500002', company: 'GreenLeaf', token: 'vikram-demo' },
    { id: 'c_aarav', name: 'Aarav Mehta', email: 'aarav@zephyr.co', phone: '919876500003', company: 'Zephyr Co.', token: 'aarav-demo' }
  ];
  const projects = [
    { id: 'p1', title: 'E-Commerce Website Redesign', clientId: 'c_meera', budget: 120000, deadline: iso(20), status: 'active', tasks: T([['UI/UX Research & Moodboard', 'done'], ['Wireframes – Desktop & Mobile', 'doing'], ['Hi-fi mockups', 'todo'], ['Frontend build', 'todo'], ['QA & handover', 'todo']]) },
    { id: 'p2', title: 'Brand Identity – Zephyr Co.', clientId: 'c_aarav', budget: 75000, deadline: iso(35), status: 'active', tasks: T([['Brand discovery call', 'done'], ['Logo concepts', 'todo'], ['Colour & type system', 'todo'], ['Brand guidelines PDF', 'todo']]) },
    { id: 'p3', title: 'PixelCraft Mobile App UI', clientId: 'c_vikram', budget: 65000, deadline: iso(-60), status: 'completed', tasks: T([['Flows', 'done'], ['Screens', 'done'], ['Handoff', 'done']]) },
    { id: 'p4', title: 'GreenLeaf Packaging Design', clientId: 'c_vikram', budget: 50000, deadline: iso(30), status: 'on-hold', tasks: T([['Dieline', 'done'], ['Artwork', 'todo'], ['Print proofs', 'todo']]) }
  ];
  const proposals = [
    { id: 'pr1', title: 'NovaTech Website & Dashboard UI', clientId: 'c_meera', amount: 180000, weeks: 10, scope: 'Marketing website plus analytics dashboard UI, responsive.', milestones: ['Research', 'Wireframes', 'Hi-fi design', 'Build', 'Handover'], status: 'accepted', createdAt: Date.now() - 8 * DAY },
    { id: 'pr2', title: 'GreenLeaf E-Commerce Store', clientId: 'c_vikram', amount: 95000, weeks: 6, scope: 'Storefront design and build.', milestones: ['Design', 'Build', 'Launch'], status: 'rejected', createdAt: Date.now() - 5 * DAY },
    { id: 'pr3', title: 'Zephyr Social Media Kit', clientId: 'c_aarav', amount: 40000, weeks: 4, scope: '30 post templates, story templates and highlight covers.', milestones: ['Moodboard', 'Template system', '30 post designs', 'Handover files'], status: 'sent', createdAt: Date.now() - DAY }
  ];
  const sig = 'Meera Kapoor';
  const contracts = [{ id: 'k1', proposalId: 'pr1', clientId: 'c_meera', projectId: 'p1', title: 'Agreement – NovaTech Website & Dashboard UI', amount: 180000, status: 'signed', text: 'Seeded demo agreement. New contracts are generated automatically when a client accepts a proposal.', createdAt: Date.now() - 7 * DAY, signed: { name: sig, signature: null, at: Date.now() - 6 * DAY, ip: '127.0.0.1', hash: crypto.createHash('sha256').update('seed').digest('hex') } }];
  const item = (d, r) => [{ description: d, qty: 1, rate: r }];
  const inv = (n, clientId, projectId, d, r, due, paid, kind) => ({ id: uid('i'), no: 'INV-00' + n, clientId, projectId, items: item(d, r), taxRate: 18, dueDate: due, status: paid ? 'paid' : 'pending', createdAt: Date.now() - 20 * DAY, paidAt: paid ? Date.parse(due) - DAY : null, reminders: [], kind: kind || 'manual' });
  const invoices = [
    inv(1, 'c_vikram', 'p3', 'PixelCraft Mobile App UI – final', 65000, iso(-50), true),
    inv(2, 'c_meera', 'p1', 'Advance 30% – website redesign', 36000, iso(-15), true, 'advance'),
    inv(3, 'c_aarav', 'p2', 'Brand identity – advance', 22500, iso(-10), true, 'advance'),
    inv(4, 'c_meera', 'p1', 'Wireframes milestone', 30000, iso(-5), false),
    inv(5, 'c_aarav', 'p2', 'Discovery workshop', 25000, iso(2), false)
  ];
  const messages = [
    { id: uid('m'), clientId: 'c_meera', from: 'freelancer', text: 'Hi Meera, wireframes are ready for your review in the portal.', at: Date.now() - 3600e3 },
    { id: uid('m'), clientId: 'c_meera', from: 'client', text: 'Looks great! Can we add a wishlist page?', at: Date.now() - 1800e3 }
  ];
  const activity = [
    { id: uid('a'), text: 'Invoice INV-003 marked as paid', at: Date.now() - 4 * 60e3 },
    { id: uid('a'), text: 'Task "Wireframes – Desktop & Mobile" moved to in progress', at: Date.now() - 5 * 60e3 },
    { id: uid('a'), text: 'Proposal "GreenLeaf E-Commerce Store" status changed to rejected', at: Date.now() - 6 * 60e3 }
  ];
  return { user: { name: 'Kanika Jangid', email: 'admin@freelanceos.in', password: 'demo123', upi: 'kanika@okaxis', role: 'freelancer' }, clients: c, projects, proposals, contracts, invoices, time: [{ id: uid('te'), projectId: 'p1', minutes: 190, note: 'Competitor research', date: iso(-6) }, { id: uid('te'), projectId: 'p1', minutes: 125, note: 'Wireframing', date: iso(-2) }], messages, activity };
}
function load() { try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { db = seed(); save(); } }

/* ---------- domain helpers ---------- */
const todayMs = () => Date.parse(iso(0));
const daysTo = (due, sim = 0) => Math.round((Date.parse(due) - (todayMs() + sim * DAY)) / DAY);
const totals = i => { const subtotal = i.items.reduce((s, x) => s + x.qty * x.rate, 0); const tax = Math.round(subtotal * (i.taxRate || 0) / 100); return { subtotal, tax, total: subtotal + tax }; };
const view = i => { const t = totals(i); const status = i.status === 'paid' ? 'paid' : daysTo(i.dueDate) < 0 ? 'overdue' : 'pending';
  return { ...i, ...t, status, upiLink: `upi://pay?pa=${encodeURIComponent(db.user.upi)}&pn=${encodeURIComponent(db.user.name)}&am=${t.total}&cu=INR&tn=${encodeURIComponent(i.no)}` }; };
const progress = p => p.tasks.length ? Math.round(100 * p.tasks.filter(t => t.status === 'done').length / p.tasks.length) : 0;
const client = id => db.clients.find(c => c.id === id);
const sysMsg = (clientId, text) => db.messages.push({ id: uid('m'), clientId, from: 'system', text, at: Date.now() });

function createInvoice(o) {
  const inv = { id: uid('i'), no: 'INV-' + String(db.invoices.length + 1).padStart(3, '0'), clientId: o.clientId, projectId: o.projectId || '', items: o.items || [], taxRate: o.taxRate ?? 18, dueDate: o.dueDate || iso(7), status: 'pending', createdAt: Date.now(), paidAt: null, reminders: [], kind: o.kind || 'manual' };
  db.invoices.push(inv); act(`Invoice ${inv.no} created (${inr(totals(inv).total)})`); return inv;
}
function afterProjectChange(p) {  // AUTOMATION: all tasks done -> project completed + final invoice auto-generated
  if (p.tasks.length && p.tasks.every(t => t.status === 'done')) {
    if (p.status !== 'completed') {
      p.status = 'completed'; act(`Project "${p.title}" completed`);
      if (!db.invoices.some(i => i.projectId === p.id && i.kind === 'final')) {
        const adv = db.invoices.filter(i => i.projectId === p.id && i.kind === 'advance').reduce((s, i) => s + totals(i).subtotal, 0);
        const rest = Math.max(0, p.budget - adv);
        if (rest > 0) { const inv = createInvoice({ clientId: p.clientId, projectId: p.id, items: [{ description: `Final payment – ${p.title}`, qty: 1, rate: rest }], dueDate: iso(7), kind: 'final' }); act(`Auto-generated final invoice ${inv.no}`); sysMsg(p.clientId, `🎉 "${p.title}" is complete. Final invoice ${inv.no} is ready in your portal.`); }
      }
    }
  } else if (p.status === 'completed') p.status = 'active';
}
function contractText(p, c) {
  return `SERVICE AGREEMENT\n\nBetween ${db.user.name} ("Freelancer") and ${c.name}${c.company ? ' (' + c.company + ')' : ''} ("Client").\n\n1. SCOPE\n${p.title}. ${p.scope || ''}\n\n2. MILESTONES\n${(p.milestones || []).map((m, i) => `   ${i + 1}. ${m}`).join('\n')}\n\n3. FEES & PAYMENT\nTotal fee ${inr(p.amount)} (+18% GST). 30% advance on signing, balance on completion. Payable via UPI; late payments trigger automated reminders.\n\n4. TIMELINE\n${p.weeks} weeks from the date of signing.\n\n5. REVISIONS\nTwo rounds of revisions are included per milestone.\n\n6. OWNERSHIP\nIntellectual property transfers to the Client on receipt of full payment.\n\n7. TERMINATION\nEither party may terminate with 7 days' written notice; completed work remains payable.\n\n8. CONFIDENTIALITY\nBoth parties keep project information confidential.\n\nThis agreement is electronically signed under the Information Technology Act, 2000 (India).`;
}
function acceptProposal(p) {
  p.status = 'accepted'; const c = client(p.clientId);
  const k = { id: uid('k'), proposalId: p.id, clientId: c.id, projectId: null, title: 'Agreement – ' + p.title, amount: p.amount, status: 'pending', text: contractText(p, c), createdAt: Date.now(), signed: null };
  db.contracts.push(k); act(`${c.name} accepted proposal "${p.title}" – contract generated`); sysMsg(c.id, `✅ Proposal accepted. Your agreement "${k.title}" is ready to e-sign below.`);
}
function signContract(k, name, signature, ip) {  // AUTOMATION: sign -> project + milestones + 30% advance invoice
  const at = Date.now(); const hash = crypto.createHash('sha256').update(k.text + '|' + name + '|' + at).digest('hex');
  k.status = 'signed'; k.signed = { name, signature, at, ip, hash };
  const p = db.proposals.find(x => x.id === k.proposalId); const c = client(k.clientId);
  const proj = { id: uid('p'), title: p.title, clientId: c.id, budget: p.amount, deadline: iso(p.weeks * 7), status: 'active', tasks: T((p.milestones.length ? p.milestones : ['Kick-off', 'Delivery']).map(m => [m, 'todo'])) };
  db.projects.push(proj); k.projectId = proj.id;
  const inv = createInvoice({ clientId: c.id, projectId: proj.id, items: [{ description: `Advance 30% – ${p.title}`, qty: 1, rate: Math.round(p.amount * 0.3) }], dueDate: iso(7), kind: 'advance' });
  act(`${name} e-signed "${k.title}" – project + advance invoice ${inv.no} created`);
  sysMsg(c.id, `✍️ Agreement signed. Project started and advance invoice ${inv.no} issued.`);
}

/* ---------- reminder engine ---------- */
const stageFor = d => d <= -7 ? 'final' : d <= -3 ? 'firm' : d <= -1 ? 'overdue' : d === 0 ? 'due' : d <= 3 ? 'upcoming' : null;
const TONE = {
  upcoming: ['Friendly heads-up', 'a gentle reminder that invoice {no} ({amt}) is due on {due}.'],
  due: ['Due today', 'invoice {no} ({amt}) is due today.'],
  overdue: ['Payment overdue', 'invoice {no} ({amt}) was due on {due} and is now overdue.'],
  firm: ['Second notice', 'invoice {no} ({amt}) is now several days overdue. Please clear it at the earliest.'],
  final: ['Final notice', 'invoice {no} ({amt}) is over a week overdue. Kindly pay today to avoid pausing the project.']
};
function runReminders(sim = 0) {
  let sent = 0;
  for (const raw of db.invoices) {
    if (raw.status === 'paid') continue;
    const st = stageFor(daysTo(raw.dueDate, sim)); if (!st || raw.reminders.some(r => r.stage === st)) continue;
    const v = view(raw), c = client(raw.clientId), [subj, line] = TONE[st];
    const body = `Hi ${c.name.split(' ')[0]},\n\n${line.replace('{no}', raw.no).replace('{amt}', inr(v.total)).replace('{due}', raw.dueDate)}\n\nPay in 10 seconds via UPI: scan the QR or open {PORTAL}\nUPI ID: ${db.user.upi}\n\nThanks,\n${db.user.name}`;
    raw.reminders.push({ id: uid('r'), stage: st, at: Date.now(), simulatedDay: sim, subject: `${subj}: ${raw.no} – ${inr(v.total)}`, body, to: c.email, phone: c.phone, clientName: c.name, invoiceNo: raw.no });
    sysMsg(c.id, `⏰ ${subj}: ${raw.no} (${inr(v.total)}) – pay from the Invoices section.`); act(`Automated "${subj}" reminder sent to ${c.name} for ${raw.no}`); sent++;
  }
  if (sent) save(); return sent;
}

/* ---------- auth ---------- */
const sign = o => { const b = Buffer.from(JSON.stringify(o)).toString('base64url'); return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); };
const verify = t => { try { const [b, s] = t.split('.'); if (crypto.createHmac('sha256', SECRET).update(b).digest('base64url') !== s) return false; return JSON.parse(Buffer.from(b, 'base64url')).exp > Date.now(); } catch { return false; } };

/* ---------- routes ---------- */
const routes = []; const R = (m, p, h, pub) => routes.push({ m, re: new RegExp('^' + p.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), h, pub });
const COLS = ['clients', 'projects', 'proposals', 'invoices', 'contracts', 'time', 'messages'];
const byToken = t => db.clients.find(c => c.token === t) || (() => { throw err(404, 'Invalid portal link'); })();

R('GET', '/api/health', () => ({ ok: true }), true);
R('POST', '/api/login', ({ body }) => { if (body.email !== db.user.email || body.password !== db.user.password) throw err(401, 'Wrong email or password'); return { token: sign({ e: body.email, exp: Date.now() + 7 * DAY }) }; }, true);
R('GET', '/api/portal/:token', ({ params }) => {
  const c = byToken(params.token);
  return { client: { name: c.name, company: c.company }, freelancer: { name: db.user.name, email: db.user.email, upi: db.user.upi },
    proposals: db.proposals.filter(p => p.clientId === c.id), contracts: db.contracts.filter(k => k.clientId === c.id),
    projects: db.projects.filter(p => p.clientId === c.id).map(p => ({ ...p, progress: progress(p) })),
    invoices: db.invoices.filter(i => i.clientId === c.id).map(view), messages: db.messages.filter(m => m.clientId === c.id) };
}, true);
R('POST', '/api/portal/:token/proposals/:id', ({ params, body }) => {
  const c = byToken(params.token), p = db.proposals.find(x => x.id === params.id && x.clientId === c.id); if (!p) throw err(404, 'Not found');
  if (p.status !== 'sent') throw err(400, 'Already ' + p.status);
  if (body.decision === 'accept') acceptProposal(p); else { p.status = 'rejected'; act(`Proposal "${p.title}" status changed to rejected`); }
  save(); return { ok: true };
}, true);
R('POST', '/api/portal/:token/contracts/:id/sign', ({ params, body, ip }) => {
  const c = byToken(params.token), k = db.contracts.find(x => x.id === params.id && x.clientId === c.id); if (!k) throw err(404, 'Not found');
  if (k.status === 'signed') throw err(400, 'Already signed'); if (!body.name || body.name.trim().length < 2) throw err(400, 'Type your full name'); if (!body.signature) throw err(400, 'Please draw your signature');
  signContract(k, body.name.trim(), body.signature, ip); save(); return { ok: true };
}, true);
R('POST', '/api/portal/:token/invoices/:id/pay', ({ params }) => {  // TEST-MODE gateway: swap for Razorpay/Stripe webhook later
  const c = byToken(params.token), i = db.invoices.find(x => x.id === params.id && x.clientId === c.id); if (!i) throw err(404, 'Not found');
  if (i.status !== 'paid') { i.status = 'paid'; i.paidAt = Date.now(); i.method = 'UPI (test mode)'; act(`Invoice ${i.no} marked as paid`); sysMsg(c.id, `💸 Payment received for ${i.no}. Thank you!`); save(); } return { ok: true };
}, true);
R('POST', '/api/portal/:token/messages', ({ params, body }) => { const c = byToken(params.token); if (!body.text) throw err(400, 'Empty'); db.messages.push({ id: uid('m'), clientId: c.id, from: 'client', text: String(body.text).slice(0, 1000), at: Date.now() }); save(); return { ok: true }; }, true);

R('GET', '/api/state', () => ({ user: { name: db.user.name, email: db.user.email, upi: db.user.upi }, clients: db.clients, projects: db.projects, proposals: db.proposals, invoices: db.invoices.map(view), contracts: db.contracts, time: db.time, messages: db.messages, activity: db.activity }));
R('POST', '/api/reminders/run', ({ body }) => { const n = runReminders(Number(body.simulateDays) || 0); save(); return { sent: n }; });
R('POST', '/api/invoices/:id/paid', ({ params }) => { const i = db.invoices.find(x => x.id === params.id); if (!i) throw err(404, 'Not found'); i.status = 'paid'; i.paidAt = Date.now(); act(`Invoice ${i.no} marked as paid`); save(); return { ok: true }; });
R('POST', '/api/reset', () => { db = seed(); save(); return { ok: true }; });
R('POST', '/api/:col', ({ params, body }) => {
  const col = params.col; if (!COLS.includes(col)) throw err(404, 'Unknown');
  let o;
  if (col === 'invoices') { o = createInvoice(body); }
  else {
    o = { ...body, id: uid(col[0]) };
    if (col === 'clients') { o.token = crypto.randomBytes(6).toString('hex'); act(`Client ${o.name} added`); }
    if (col === 'projects') { o.tasks = o.tasks || []; o.status = o.status || 'active'; act(`Project "${o.title}" added`); }
    if (col === 'proposals') { o.status = 'sent'; o.createdAt = Date.now(); o.milestones = o.milestones || []; act(`Proposal "${o.title}" sent`); }
    if (col === 'time') { o.date = iso(0); }
    if (col === 'messages') { o.from = 'freelancer'; o.at = Date.now(); }
    db[col].push(o);
  }
  save(); return o;
});
R('PUT', '/api/:col/:id', ({ params, body }) => {
  if (!COLS.includes(params.col)) throw err(404, 'Unknown'); const o = db[params.col].find(x => x.id === params.id); if (!o) throw err(404, 'Not found');
  if (params.col === 'projects' && body.tasks) { body.tasks.forEach(t => { const old = o.tasks.find(x => x.id === t.id); if (old && old.status !== t.status) act(`Task "${t.title}" moved to ${t.status === 'done' ? 'completed' : t.status === 'doing' ? 'in progress' : 'to-do'}`); }); }
  Object.assign(o, body, { id: o.id }); if (params.col === 'projects') afterProjectChange(o); save(); return o;
});
R('DELETE', '/api/:col/:id', ({ params }) => { if (!COLS.includes(params.col)) throw err(404, 'Unknown'); db[params.col] = db[params.col].filter(x => x.id !== params.id); save(); return { ok: true }; });

/* ---------- server ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };
const json = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (!u.pathname.startsWith('/api/')) {
    let f = path.join(__dirname, 'public', u.pathname === '/' ? 'index.html' : u.pathname);
    if (!f.startsWith(path.join(__dirname, 'public')) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(__dirname, 'public', 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); return fs.createReadStream(f).pipe(res);
  }
  let raw = ''; req.on('data', c => { raw += c; if (raw.length > 3e6) req.destroy(); });
  req.on('end', () => {
    try {
      const r = routes.find(r => r.m === req.method && r.re.test(u.pathname)); if (!r) throw err(404, 'Not found');
      if (!r.pub) { const t = (req.headers.authorization || '').replace('Bearer ', ''); if (!verify(t)) throw err(401, 'Login required'); }
      const params = u.pathname.match(r.re).groups || {};
      json(res, 200, r.h({ params, body: raw ? JSON.parse(raw) : {}, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress }));
    } catch (e) { json(res, e.status || 500, { error: e.message }); }
  });
}).listen(PORT, () => { load(); console.log(`FreelanceOS running on http://localhost:${PORT}`); console.log('Login: admin@freelanceos.in / demo123'); });
load(); setInterval(() => runReminders(0), 60e3);  // background reminder cron (real time)
