// API demonstrativa local do Cuidar+.
// Usada somente quando a API REST não está disponível; os dados ficam neste navegador.
const DB_KEY = 'cuidar.demo.db.v1';
const LOCAL_MODE_KEY = 'cuidar.demo.local';
const DEMO_PASSWORD = 'Cuidar@123';
const PBKDF2_ITERATIONS = 150000;
const DEMO_SALT = '9f35c1a042f8b06e7d0291a64b0c7e53';
const DEMO_HASH = '97188daadbd461550b0395a1058ea7717429c5ea23597ca869ac6b951cf1549b';
const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const today = () => new Date().toISOString().slice(0, 10);
const clone = (value) => JSON.parse(JSON.stringify(value));
const id = (rows) => rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1;
const cleanEmail = (value) => String(value || '').trim().toLowerCase();
const bytesFromHex = (hex) => new Uint8Array(hex.match(/.{2}/g).map((part) => parseInt(part, 16)));
const hexFromBytes = (bytes) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
async function hashPassword(password, saltHex = hexFromBytes(crypto.getRandomValues(new Uint8Array(16)))) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: bytesFromHex(saltHex), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, material, 256);
  return { senhaSalt: saltHex, senhaHash: hexFromBytes(bits) };
}
async function passwordMatches(password, user) {
  if (!user.senhaHash || !user.senhaSalt) return false;
  const actual = await hashPassword(password, user.senhaSalt);
  return actual.senhaHash === user.senhaHash;
}
const error = (status, message, details) => {
  const e = new Error(message);
  e.status = status;
  e.detalhes = details;
  throw e;
};
function initialDb() {
  const stamp = now();
  const users = [
    { id: 1, nome: 'Coordenação Cuidar+', email: 'admin@cuidar.local', cpf: '529.982.247-25', senhaSalt: DEMO_SALT, senhaHash: DEMO_HASH, perfil: 'administrador', criadoEm: stamp, ativo: true },
    { id: 2, nome: 'Denise Martins', email: 'cuidadora@cuidar.local', cpf: '111.444.777-35', senhaSalt: DEMO_SALT, senhaHash: DEMO_HASH, perfil: 'cuidador', criadoEm: stamp, ativo: true },
    { id: 3, nome: 'Larissa Martins', email: 'familiar@cuidar.local', cpf: '123.456.789-09', senhaSalt: DEMO_SALT, senhaHash: DEMO_HASH, perfil: 'familiar', criadoEm: stamp, ativo: true },
  ];
  const resident = { id: 1, nome: 'Maria Aparecida da Silva', dataNascimento: '1946-05-12', telefone: '(62) 99999-0000', endereco: 'Rua das Flores, 100 - Anápolis/GO', observacoes: 'Hipertensa. Prefere refeições leves à noite.', codigoVinculo: 'CUIDAR-DEMO23', criadoPor: 2, papel: 'cuidador', criadoEm: stamp };
  const date = today();
  return {
    version: 1, nextId: 10, users, residents: [resident],
    links: [{ usuarioId: 2, idosoId: 1, papel: 'cuidador', vinculadoEm: stamp }, { usuarioId: 3, idosoId: 1, papel: 'familiar', vinculadoEm: stamp }],
    invites: [{ id: 1, idosoId: 1, email: 'neto@cuidar.local', criadoPor: 2, criadoEm: stamp }],
    medicines: [{ id: 1, idosoId: 1, nome: 'Losartana', dosagem: '50 mg', via: 'Oral', horarios: ['08:00', '20:00'], observacoes: '', ativo: true }],
    doses: [],
    cares: [
      { id: 1, idosoId: 1, titulo: 'Café da manhã', descricao: 'Fruta e pão integral', tipo: 'alimentacao', data: date, horario: '07:30', concluido: false },
      { id: 2, idosoId: 1, titulo: 'Banho', descricao: 'Com auxílio', tipo: 'higiene', data: date, horario: '10:00', concluido: false },
      { id: 3, idosoId: 1, titulo: 'Caminhada leve', descricao: '20 minutos no quintal', tipo: 'atividade_fisica', data: date, horario: '16:00', concluido: false },
    ],
    records: [],
    appointments: [{ id: 1, idosoId: 1, titulo: 'Cardiologista', local: 'Clínica Coração - Anápolis', descricao: '', data: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), horario: '14:30', realizada: false }],
    notes: [{ id: 1, idosoId: 1, titulo: 'Dormiu bem', categoria: 'sono', texto: 'Dormiu a noite toda, sem despertares.', dataHora: stamp, autor: users[1].nome }],
  };
}
async function dbRead() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const db = JSON.parse(raw);
      let migrated = false;
      for (const user of db.users || []) {
        if (user.senha) {
          Object.assign(user, await hashPassword(user.senha));
          delete user.senha;
          migrated = true;
        }
        const standardNames = {
          'admin@cuidar.local': ['Administrador Demo', 'Coordenação Cuidar+'],
          'cuidadora@cuidar.local': ['Denise (Cuidadora Demo)', 'Denise Martins'],
          'familiar@cuidar.local': ['Larissa (Familiar Demo)', 'Larissa Martins'],
        };
        const replacement = standardNames[cleanEmail(user.email)];
        if (replacement && user.nome === replacement[0]) {
          user.nome = replacement[1];
          migrated = true;
        }
      }
      if (migrated) dbWrite(db);
      return db;
    }
  } catch { /* inicia com dados demonstrativos limpos */ }
  const fresh = initialDb();
  dbWrite(fresh);
  return fresh;
}
function dbWrite(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
const next = (db, collection) => {
  const value = id(db[collection]);
  db.nextId = Math.max(db.nextId || 1, value + 1);
  return value;
};
function currentUser(db) {
  const raw = localStorage.getItem('cuidar.usuario');
  let session;
  try { session = JSON.parse(raw); } catch { session = null; }
  if (!session) error(401, 'Entre novamente para continuar.');
  const user = db.users.find((u) => Number(u.id) === Number(session.id));
  if (!user || !user.ativo) error(401, 'Sua sessão não está válida.');
  return user;
}
function requireRole(user, roles) { if (!roles.includes(user.perfil)) error(403, 'Você não tem permissão para esta ação.'); }
function linked(db, user, residentId) {
  const resident = db.residents.find((r) => Number(r.id) === Number(residentId));
  if (!resident) error(404, 'Idoso não encontrado.');
  if (user.perfil === 'administrador') error(403, 'Administradores não acessam informações de saúde.');
  const link = db.links.find((x) => Number(x.idosoId) === Number(residentId) && Number(x.usuarioId) === Number(user.id));
  if (!link) error(403, 'Você não está vinculado a este idoso.');
  return { ...resident, papel: link.papel };
}
const resourceNames = { medicamentos: 'medicines', cuidados: 'cares', consultas: 'appointments', registros: 'records', observacoes: 'notes' };
function owned(db, table, residentId) { return db[table].filter((item) => Number(item.idosoId) === Number(residentId)); }
function visibleResidents(db, user) {
  return db.residents.filter((r) => user.perfil === 'administrador' ? false : db.links.some((l) => Number(l.idosoId) === Number(r.id) && Number(l.usuarioId) === Number(user.id)))
    .map((r) => ({ id: r.id, nome: r.nome, dataNascimento: r.dataNascimento, papel: db.links.find((l) => Number(l.idosoId) === Number(r.id) && Number(l.usuarioId) === Number(user.id))?.papel }));
}
function summary(db, residentId) {
  const date = today();
  const cares = owned(db, 'cares', residentId).filter((x) => x.data === date);
  const meds = owned(db, 'medicines', residentId).filter((x) => x.ativo !== false);
  const totalDoses = meds.reduce((n, m) => n + (m.horarios || []).length, 0);
  const doses = owned(db, 'doses', residentId).filter((x) => x.data === date);
  const records = owned(db, 'records', residentId).filter((x) => String(x.dataHora).slice(0, 10) === date);
  const water = records.filter((x) => x.tipo === 'hidratacao');
  const completedCares = cares.filter((x) => x.concluido).length;
  const completedMeds = doses.length;
  const total = cares.length + totalDoses;
  const completed = completedCares + completedMeds;
  const nextAppointment = owned(db, 'appointments', residentId).filter((x) => !x.realizada && x.data >= date).sort((a, b) => `${a.data}${a.horario}`.localeCompare(`${b.data}${b.horario}`))[0] || null;
  const notes = owned(db, 'notes', residentId).sort((a, b) => b.dataHora.localeCompare(a.dataHora)).slice(0, 5);
  const pending = [
    ...cares.filter((x) => !x.concluido).map((x) => ({ tipoItem: 'cuidado', titulo: x.titulo, detalhes: x.descricao || '', horario: x.horario, subtipo: x.tipo, concluido: false })),
    ...meds.flatMap((m) => (m.horarios || []).filter((h) => !doses.some((d) => Number(d.medicamentoId) === Number(m.id) && d.horario === h && d.data === date)).map((h) => ({ tipoItem: 'medicamento', titulo: m.nome, detalhes: [m.dosagem, m.via].filter(Boolean).join(' · '), horario: h, subtipo: 'medicamento', concluido: false }))),
  ].sort((a, b) => a.horario.localeCompare(b.horario));
  return {
    proximaConsulta: nextAppointment,
    cuidados: { concluidos: completedCares, total: cares.length },
    medicamentos: { concluidos: completedMeds, total: totalDoses },
    registros: { aguaMl: water.reduce((n, x) => n + (Number(x.quantidadeMl) || 0), 0), refeicoes: records.filter((x) => x.tipo === 'alimentacao').length },
    progresso: { concluidos: completed, total, percentual: total ? Math.round(completed / total * 100) : 0 },
    pendentes: pending,
    ultimasObservacoes: notes,
  };
}
function dayRecords(db, residentId, date) { return owned(db, 'records', residentId).filter((x) => !date || String(x.dataHora).slice(0, 10) === date); }
function recordsSummary(db, residentId, date) {
  const list = dayRecords(db, residentId, date);
  return {
    aguaMl: list.filter((x) => x.tipo === 'hidratacao').reduce((n, x) => n + (Number(x.quantidadeMl) || 0), 0),
    hidratacoes: list.filter((x) => x.tipo === 'hidratacao').length,
    refeicoes: list.filter((x) => x.tipo === 'alimentacao').length,
    higiene: list.filter((x) => x.tipo === 'higiene').length,
    atividadesFisicas: list.filter((x) => x.tipo === 'atividade_fisica').length,
  };
}
function historyItems(db, residentId) {
  const records = owned(db, 'records', residentId).map((x) => ({ dataHora: x.dataHora, tipo: x.tipo, subtipo: x.tipo, titulo: x.tipo === 'hidratacao' ? `${x.quantidadeMl || 0} ml de água` : x.tipo.replaceAll('_', ' '), detalhes: x.descricao || '', autor: x.autor || '' }));
  const notes = owned(db, 'notes', residentId).map((x) => ({ dataHora: x.dataHora, tipo: 'observacao', subtipo: x.categoria, titulo: x.titulo, detalhes: x.texto, autor: x.autor || '' }));
  const cares = owned(db, 'cares', residentId).map((x) => ({ dataHora: `${x.data} ${x.horario}:00`, tipo: 'cuidado', subtipo: x.tipo, titulo: x.titulo, detalhes: x.descricao || '', autor: x.autor || '' }));
  return [...records, ...notes, ...cares].sort((a, b) => b.dataHora.localeCompare(a.dataHora));
}
function makeRoutine(db, residentId, date) {
  const careItems = owned(db, 'cares', residentId).filter((x) => x.data === date).map((x) => ({ chave: `cuidado-${x.id}`, tipoItem: 'cuidado', id: x.id, horario: x.horario, titulo: x.titulo, subtipo: x.tipo, detalhes: x.descricao || '', concluido: Boolean(x.concluido), concluidoEm: x.concluidoEm || null, concluidoPor: x.concluidoPor || '' }));
  const doseItems = owned(db, 'medicines', residentId).filter((m) => m.ativo !== false).flatMap((m) => (m.horarios || []).map((h) => {
    const dose = db.doses.find((d) => Number(d.medicationId || d.medicamentoId) === Number(m.id) && d.data === date && d.horario === h);
    return { chave: `medicamento-${m.id}-${date}-${h}`, tipoItem: 'medicamento', id: m.id, medicamentoId: m.id, horario: h, titulo: m.nome, subtipo: 'medicamento', detalhes: [m.dosagem, m.via].filter(Boolean).join(' · '), concluido: Boolean(dose), concluidoEm: dose?.concluidoEm || null, concluidoPor: dose?.autor || '' };
  }));
  const appointmentItems = owned(db, 'appointments', residentId).filter((x) => x.data === date).map((x) => ({ chave: `consulta-${x.id}`, tipoItem: 'consulta', id: x.id, horario: x.horario, titulo: x.titulo, subtipo: 'consulta', detalhes: x.local || x.descricao || '', concluido: Boolean(x.realizada), concluidoEm: null, concluidoPor: '' }));
  const items = [...careItems, ...doseItems, ...appointmentItems].sort((a, b) => a.horario.localeCompare(b.horario));
  const concluidos = items.filter((x) => x.concluido).length;
  return { itens: items, resumo: { concluidos, pendentes: items.length - concluidos } };
}
function ensureAdmin(user) { requireRole(user, ['administrador']); }
async function routeLocal(db, user, method, pathname, params, body) {
  const p = pathname.replace(/^\/api\/v1/, '').replace(/\/$/, '') || '/';
  if (p === '/auth/login' && method === 'POST') {
    const u = db.users.find((x) => cleanEmail(x.email) === cleanEmail(body.email));
    if (!u || !(await passwordMatches(body.senha, u))) error(401, 'E-mail ou senha incorretos.');
    if (!u.ativo) error(403, 'Esta conta está desativada. Procure o administrador.');
    return { token: `demo-${u.id}-${Date.now()}`, usuario: { id: u.id, nome: u.nome, email: u.email, perfil: u.perfil } };
  }
  if (p === '/auth/registro' && method === 'POST') {
    if (db.users.some((u) => cleanEmail(u.email) === cleanEmail(body.email))) error(409, 'Este e-mail já está cadastrado.');
    if (db.users.some((u) => String(u.cpf || '').replace(/\D/g, '') === String(body.cpf || '').replace(/\D/g, ''))) error(409, 'Este CPF já está cadastrado.');
    if (!['cuidador', 'familiar'].includes(body.perfil)) error(400, 'Perfil inválido.');
    if (!body.senha || body.senha.length < 8) error(400, 'A senha deve ter no mínimo 8 caracteres.');
    const u = { id: next(db, 'users'), nome: body.nome, email: cleanEmail(body.email), cpf: body.cpf, ...(await hashPassword(body.senha)), perfil: body.perfil, criadoEm: now(), ativo: true };
    db.users.push(u);
    const activated = [];
    if (u.perfil === 'familiar') db.invites.filter((x) => cleanEmail(x.email) === u.email).forEach((invite) => {
      db.links.push({ usuarioId: u.id, idosoId: invite.idosoId, papel: 'familiar', vinculadoEm: now() });
      activated.push(invite.idosoId);
    });
    db.invites = db.invites.filter((x) => cleanEmail(x.email) !== u.email);
    return { token: `demo-${u.id}-${Date.now()}`, usuario: { id: u.id, nome: u.nome, email: u.email, perfil: u.perfil }, vinculosAtivados: activated };
  }
  if (p === '/auth/me' && method === 'GET') return { usuario: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil } };

  if (p === '/admin/estatisticas' && method === 'GET') {
    ensureAdmin(user);
    return { usuarios: db.users.length, cuidadores: db.users.filter((u) => u.perfil === 'cuidador').length, familiares: db.users.filter((u) => u.perfil === 'familiar').length, idosos: db.residents.length, inativos: db.users.filter((u) => !u.ativo).length };
  }
  if (p === '/admin/usuarios' && method === 'GET') {
    ensureAdmin(user);
    const term = cleanEmail(params.busca || '');
    return db.users.filter((u) => !term || `${u.nome} ${u.email}`.toLowerCase().includes(term))
      .map(({ senha, senhaSalt, senhaHash, ...u }) => u);
  }
  if (p === '/admin/usuarios' && method === 'POST') {
    ensureAdmin(user);
    if (db.users.some((u) => cleanEmail(u.email) === cleanEmail(body.email))) error(409, 'Este e-mail já está cadastrado.');
    const u = { id: next(db, 'users'), ...body, ...(await hashPassword(body.senha)), email: cleanEmail(body.email), criadoEm: now(), ativo: true };
    delete u.senha;
    db.users.push(u);
    const selected = Array.isArray(body.idosoIds) ? body.idosoIds.map(Number) : [];
    selected.forEach((residentId) => { if (db.residents.some((r) => Number(r.id) === residentId)) db.links.push({ usuarioId: u.id, idosoId: residentId, papel: u.perfil, vinculadoEm: now() }); });
    return { id: u.id, vinculosCriados: selected.length };
  }
  const adminUser = p.match(/^\/admin\/usuarios\/(\d+)$/);
  if (adminUser && method === 'PATCH') {
    ensureAdmin(user);
    const u = db.users.find((x) => Number(x.id) === Number(adminUser[1]));
    if (!u) error(404, 'Usuário não encontrado.');
    Object.assign(u, body);
    return { ok: true };
  }
  if (p === '/admin/idosos' && method === 'GET') { ensureAdmin(user); return db.residents.map((r) => ({ id: r.id, nome: r.nome })); }

  if (p === '/idosos' && method === 'GET') return visibleResidents(db, user);
  if (p === '/idosos' && method === 'POST') {
    requireRole(user, ['cuidador']);
    const resident = { id: next(db, 'residents'), ...body, criadoPor: user.id, papel: 'cuidador', codigoVinculo: `CUIDAR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, criadoEm: now() };
    db.residents.push(resident);
    db.links.push({ usuarioId: user.id, idosoId: resident.id, papel: 'cuidador', vinculadoEm: now() });
    return { id: resident.id, nome: resident.nome };
  }
  if (p === '/idosos/vincular' && method === 'POST') {
    const resident = db.residents.find((r) => r.codigoVinculo === String(body.codigo || '').toUpperCase());
    if (!resident) error(404, 'Código de vínculo inválido.');
    if (!db.links.some((x) => Number(x.idosoId) === Number(resident.id) && Number(x.usuarioId) === Number(user.id))) db.links.push({ usuarioId: user.id, idosoId: resident.id, papel: user.perfil, vinculadoEm: now() });
    return { id: resident.id, nome: resident.nome };
  }
  const residentMatch = p.match(/^\/idosos\/(\d+)(?:\/(.*))?$/);
  if (!residentMatch) error(404, 'Rota não encontrada.');
  const residentId = Number(residentMatch[1]);
  const sub = residentMatch[2] || '';
  const resident = linked(db, user, residentId);
  const canEdit = user.perfil === 'cuidador';
  const writeGuard = () => { if (!canEdit) error(403, 'Acesso somente para leitura.'); };
  if (!sub && method === 'GET') return clone(resident);
  if (!sub && method === 'PUT') { writeGuard(); Object.assign(db.residents.find((r) => Number(r.id) === residentId), body); return { ok: true }; }
  if (!sub && method === 'DELETE') {
    writeGuard(); db.residents = db.residents.filter((r) => Number(r.id) !== residentId);
    for (const key of ['links', 'invites', 'medicines', 'doses', 'cares', 'records', 'appointments', 'notes']) db[key] = db[key].filter((x) => Number(x.idosoId) !== residentId);
    return null;
  }
  if (sub === 'codigo' && method === 'POST') { writeGuard(); const r = db.residents.find((x) => Number(x.id) === residentId); r.codigoVinculo = `CUIDAR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; return { codigoVinculo: r.codigoVinculo }; }
  if (sub === 'vinculos' && method === 'GET') { writeGuard(); return db.links.filter((x) => Number(x.idosoId) === residentId).map((l) => { const u = db.users.find((x) => Number(x.id) === Number(l.usuarioId)); return { usuarioId: l.usuarioId, nome: u?.nome || '', email: u?.email || '', papel: l.papel, vinculadoEm: l.vinculadoEm }; }); }
  const linkDelete = sub.match(/^vinculos\/(\d+)$/);
  if (linkDelete && method === 'DELETE') { db.links = db.links.filter((x) => !(Number(x.idosoId) === residentId && Number(x.usuarioId) === Number(linkDelete[1]))); return null; }
  if (sub === 'convites' && method === 'GET') { writeGuard(); return db.invites.filter((x) => Number(x.idosoId) === residentId).map((x) => ({ id: x.id, email: x.email, criadoEm: x.criadoEm })); }
  if (sub === 'convites' && method === 'POST') {
    writeGuard(); const email = cleanEmail(body.email); const target = db.users.find((x) => cleanEmail(x.email) === email && x.perfil === 'familiar');
    if (target) { if (!db.links.some((x) => Number(x.idosoId) === residentId && Number(x.usuarioId) === Number(target.id))) db.links.push({ usuarioId: target.id, idosoId: residentId, papel: 'familiar', vinculadoEm: now() }); return { situacao: 'vinculado' }; }
    if (!db.invites.some((x) => Number(x.idosoId) === residentId && cleanEmail(x.email) === email)) db.invites.push({ id: next(db, 'invites'), idosoId: residentId, email, criadoPor: user.id, criadoEm: now() });
    return { situacao: 'pendente' };
  }
  const inviteDelete = sub.match(/^convites\/(\d+)$/);
  if (inviteDelete && method === 'DELETE') { writeGuard(); db.invites = db.invites.filter((x) => !(Number(x.idosoId) === residentId && Number(x.id) === Number(inviteDelete[1]))); return null; }
  if (sub === 'resumo' && method === 'GET') return summary(db, residentId);
  if (sub === 'rotina' && method === 'GET') return makeRoutine(db, residentId, params.data || today());
  if (sub === 'lembretes' && method === 'GET') {
    const maxAhead = Number(params.antecedencia) || 30;
    const current = new Date();
    const currentDay = current.toISOString().slice(0, 10);
    const itens = makeRoutine(db, residentId, currentDay).itens
      .filter((item) => !item.concluido)
      .map((item) => {
        const target = new Date(`${currentDay}T${String(item.horario).slice(0, 5)}:00`);
        const minutes = Math.round((target.getTime() - current.getTime()) / 60000);
        return { ...item, minutos: minutes, situacao: minutes < 0 ? 'atrasado' : 'proximo' };
      })
      .filter((item) => item.minutos >= -30 && item.minutos <= maxAhead);
    return { itens };
  }
  if (sub === 'historico' && method === 'GET') {
    let list = historyItems(db, residentId);
    if (params.de) list = list.filter((x) => x.dataHora.slice(0, 10) >= params.de);
    if (params.ate) list = list.filter((x) => x.dataHora.slice(0, 10) <= params.ate);
    if (params.tipo) list = list.filter((x) => x.tipo === params.tipo || x.subtipo === params.tipo);
    const page = Math.max(1, Number(params.pagina) || 1); const size = Math.max(1, Number(params.tamanho) || 20); const total = list.length;
    return { itens: list.slice((page - 1) * size, page * size), total, pagina: page, totalPaginas: Math.max(1, Math.ceil(total / size)) };
  }
  for (const [routeName, table] of Object.entries(resourceNames)) {
    if (!sub.startsWith(`${routeName}`)) continue;
    const suffix = sub.slice(routeName.length).replace(/^\//, '');
    const rows = owned(db, table, residentId);
    if (routeName === 'medicamentos' && suffix === 'agenda' && method === 'GET') {
      return rows.filter((m) => m.ativo !== false).flatMap((m) => (m.horarios || []).map((h) => ({ medicamentoId: m.id, medicamento: m.nome, dosagem: m.dosagem, horario: h })));
    }
    if (routeName === 'medicamentos' && suffix === 'doses') {
      if (method === 'POST') { writeGuard(); const dose = { id: next(db, 'doses'), idosoId: residentId, ...body, data: body.data || today(), medicationId: Number(body.medicamentoId), concluidoEm: now(), autor: user.nome }; if (!db.doses.some((x) => Number(x.medicamentoId) === dose.medicationId && x.data === dose.data && x.horario === dose.horario)) db.doses.push(dose); return { ok: true }; }
      if (method === 'DELETE') { writeGuard(); db.doses = db.doses.filter((x) => !(Number(x.idosoId) === residentId && Number(x.medicamentoId) === Number(params.medicamentoId) && x.data === params.data && x.horario === params.horario)); return null; }
    }
    if (routeName === 'registros' && suffix === 'resumo' && method === 'GET') return recordsSummary(db, residentId, params.data || today());
    if (!suffix && method === 'GET') {
      let list = rows;
      if (routeName === 'registros' && params.data) list = list.filter((x) => x.dataHora.slice(0, 10) === params.data);
      if (routeName === 'registros' && params.tipo) list = list.filter((x) => x.tipo === params.tipo);
      if (routeName === 'observacoes' && params.categoria) list = list.filter((x) => x.categoria === params.categoria);
      return clone(list);
    }
    if (!suffix && method === 'POST') {
      writeGuard(); const item = { id: next(db, table), idosoId: residentId, ...body, autor: user.nome };
      if (table === 'records') item.dataHora = body.dataHora ? String(body.dataHora).replace('T', ' ') + (String(body.dataHora).length === 16 ? ':00' : '') : now();
      if (table === 'notes') item.dataHora = body.dataHora ? String(body.dataHora).replace('T', ' ') + (String(body.dataHora).length === 16 ? ':00' : '') : now();
      if (table === 'cares') { item.data = body.data || today(); item.horario = String(body.horario || '12:00').slice(0, 5); item.concluido = false; }
      if (table === 'appointments') { item.realizada = Boolean(body.realizada); item.horario = String(body.horario || '12:00').slice(0, 5); }
      if (table === 'medicines') { item.ativo = body.ativo !== false; item.horarios = Array.isArray(body.horarios) ? body.horarios.map((h) => String(h).slice(0, 5)) : []; }
      db[table].push(item);
      if (table === 'cares' && Number(body.repetirDias) > 0) for (let i = 1; i <= Number(body.repetirDias); i += 1) { const d = new Date(`${item.data}T12:00:00`); d.setDate(d.getDate() + i); db.cares.push({ ...item, id: next(db, 'cares'), data: d.toISOString().slice(0, 10) }); }
      return { id: item.id, nome: item.nome, titulo: item.titulo };
    }
    if (routeName === 'cuidados' && suffix === '' && method === 'GET') return rows.filter((x) => !params.data || x.data === params.data);
    const completeSuffix = suffix.replace(/^\//, '');
    const matchConclude = completeSuffix.match(/^(\d+)\/(concluir|realizada)$/);
    if (matchConclude && method === 'PATCH') {
      writeGuard(); const item = rows.find((x) => Number(x.id) === Number(matchConclude[1])); if (!item) error(404, 'Registro não encontrado.');
      if (matchConclude[2] === 'concluir') { item.concluido = Boolean(body.concluido); item.concluidoEm = item.concluido ? now() : null; item.concluidoPor = item.concluido ? user.nome : ''; }
      else item.realizada = Boolean(body.realizada);
      return { ok: true };
    }
    const itemMatch = completeSuffix.match(/^(\d+)$/);
    if (itemMatch && method === 'GET') { const item = rows.find((x) => Number(x.id) === Number(itemMatch[1])); if (!item) error(404, 'Registro não encontrado.'); return clone(item); }
    if (itemMatch && method === 'PUT') { writeGuard(); const item = rows.find((x) => Number(x.id) === Number(itemMatch[1])); if (!item) error(404, 'Registro não encontrado.'); Object.assign(item, body); if (table === 'records' || table === 'notes') item.dataHora = String(body.dataHora || item.dataHora).replace('T', ' '); if (table === 'cares') { item.data = body.data || item.data; item.horario = String(body.horario || item.horario).slice(0, 5); } return { ok: true }; }
    if (itemMatch && method === 'DELETE') { writeGuard(); db[table] = db[table].filter((x) => !(Number(x.idosoId) === residentId && Number(x.id) === Number(itemMatch[1]))); return null; }
  }
  error(404, 'Rota local não implementada.');
}
export function isLocalDemo() { return localStorage.getItem(LOCAL_MODE_KEY) === '1'; }
export function markLocalDemo() { localStorage.setItem(LOCAL_MODE_KEY, '1'); }
export function resetLocalDemo() {
  [DB_KEY, LOCAL_MODE_KEY, 'cuidar.token', 'cuidar.usuario', 'cuidar.idoso'].forEach((key) => localStorage.removeItem(key));
}
export async function requestLocal(method, url, body) {
  markLocalDemo();
  const parsed = new URL(url, location.href);
  const params = Object.fromEntries(parsed.searchParams.entries());
  const db = await dbRead();
  const publicAuth = parsed.pathname.endsWith('/auth/login') || parsed.pathname.endsWith('/auth/registro');
  const user = publicAuth ? null : currentUser(db);
  try {
    const data = await routeLocal(db, user, method, parsed.pathname, params, body || {});
    dbWrite(db);
    return data;
  } catch (e) {
    dbWrite(db);
    throw e;
  }
}
export function demoCredentials() {
  return [
    { email: 'cuidadora@cuidar.local', password: DEMO_PASSWORD, role: 'Cuidadora' },
    { email: 'familiar@cuidar.local', password: DEMO_PASSWORD, role: 'Familiar' },
    { email: 'admin@cuidar.local', password: DEMO_PASSWORD, role: 'Administrador' },
  ];
}
