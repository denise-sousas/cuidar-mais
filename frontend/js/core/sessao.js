// Sessão do usuário no navegador (token + dados básicos + idoso escolhido).
// Observação de segurança: o token fica no localStorage. Por isso TODO texto
// vindo da API é escapado antes de ir para a tela (veja esc() em formatadores.js).
const CHAVE_TOKEN = 'cuidar.token';
const CHAVE_USUARIO = 'cuidar.usuario';
const CHAVE_IDOSO = 'cuidar.idoso';

export const obterToken = () => localStorage.getItem(CHAVE_TOKEN);

export function obterUsuario() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_USUARIO));
  } catch {
    return null;
  }
}

export function salvarSessao({ token, usuario }) {
  localStorage.setItem(CHAVE_TOKEN, token);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function encerrarSessao() {
  [CHAVE_TOKEN, CHAVE_USUARIO, CHAVE_IDOSO].forEach((chave) => localStorage.removeItem(chave));
  sessionStorage.clear();
}

export const obterIdosoSelecionado = () => Number(localStorage.getItem(CHAVE_IDOSO)) || null;
export const definirIdosoSelecionado = (id) => localStorage.setItem(CHAVE_IDOSO, String(id));

export const paginaInicial = (usuario) => (usuario.perfil === 'administrador' ? 'admin.html' : 'dashboard.html');
