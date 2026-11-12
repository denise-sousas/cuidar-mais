// Funções de formatação (datas, textos) e dicionários de rótulos/ícones.

// Escapa texto antes de colocar em innerHTML (evita injeção de HTML/JS - XSS).
export function esc(valor = '') {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const dois = (n) => String(n).padStart(2, '0');

export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

export function agoraParaInput() {
  const d = new Date();
  return `${hojeISO()}T${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

export function adicionarDias(iso, dias) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

export function formatarData(iso) {
  if (!iso) return '—';
  const [ano, mes, dia] = String(iso).slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

export const formatarHora = (hora) => (hora ? String(hora).slice(0, 5) : '');

export function formatarDataHora(texto) {
  if (!texto) return '—';
  return `${formatarData(texto)} às ${String(texto).slice(11, 16)}`;
}

export function dataPorExtenso(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const nasc = new Date(`${String(dataNascimento).slice(0, 10)}T12:00:00`);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const aniversarioPassou =
    hoje.getMonth() > nasc.getMonth() || (hoje.getMonth() === nasc.getMonth() && hoje.getDate() >= nasc.getDate());
  if (!aniversarioPassou) idade -= 1;
  return idade;
}

export function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  return (partes.length > 1 ? partes[0][0] + partes[partes.length - 1][0] : partes[0][0]).toUpperCase();
}

// ----- Rótulos (devem combinar com os valores aceitos pela API) -----
export const TIPOS_CUIDADO = {
  higiene: 'Higiene',
  alimentacao: 'Alimentação',
  hidratacao: 'Hidratação',
  atividade_fisica: 'Atividade física',
  sono: 'Sono',
  outro: 'Outro',
};
export const TIPOS_REGISTRO = {
  alimentacao: 'Alimentação',
  hidratacao: 'Hidratação',
  higiene: 'Higiene',
  atividade_fisica: 'Atividade física',
  outro: 'Outro',
};
export const CATEGORIAS_OBSERVACAO = {
  saude: 'Saúde',
  comportamento: 'Comportamento',
  alimentacao: 'Alimentação',
  sono: 'Sono',
  consulta: 'Consulta',
  outro: 'Outro',
};
export const TIPOS_HISTORICO = {
  cuidado: 'Cuidados',
  medicamento: 'Medicamentos',
  registro: 'Registros (alimentação, água, higiene)',
  observacao: 'Observações',
  consulta: 'Consultas',
};
export const PERFIS = { administrador: 'Administrador', cuidador: 'Cuidador', familiar: 'Familiar' };

const ICONES = {
  higiene: 'fa-soap',
  alimentacao: 'fa-utensils',
  hidratacao: 'fa-glass-water',
  atividade_fisica: 'fa-person-walking',
  sono: 'fa-bed',
  saude: 'fa-heart-pulse',
  comportamento: 'fa-face-smile',
  outro: 'fa-circle-info',
  medicamento: 'fa-pills',
  consulta: 'fa-stethoscope',
  observacao: 'fa-note-sticky',
  cuidado: 'fa-heart-pulse',
  registro: 'fa-clipboard-list',
};
export const icone = (chave) => ICONES[chave] || 'fa-circle-info';

// Converte { chave: 'Rótulo' } em [{ valor, rotulo }] para os <select>.
export const opcoes = (mapa) => Object.entries(mapa).map(([valor, rotulo]) => ({ valor, rotulo }));
