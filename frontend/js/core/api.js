// Cliente HTTP da API do Cuidar+. Todas as telas usam este arquivo para falar com o backend.
//   const idosos = await api.get('/idosos');
//   await api.post(`/idosos/${id}/cuidados`, { titulo: '...' });
import { obterToken, encerrarSessao } from './sessao.js';
import { isLocalDemo, requestLocal } from './local-api.js';

// Se abrir o frontend fora do backend (ex.: Live Server), defina antes dos scripts:
//   <script>window.CUIDAR_API_URL = 'http://localhost:3000/api/v1'</script>
const BASE = window.CUIDAR_API_URL || '/api/v1';

export class ErroApi extends Error {
  constructor(status, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes; // { campo: 'mensagem' } nos erros de validação
  }
}

async function requisitar(metodo, caminho, { corpo, parametros } = {}) {
  const url = new URL(BASE + caminho, window.location.origin);
  Object.entries(parametros || {}).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(chave, valor);
  });

  if (isLocalDemo()) return requestLocal(metodo, url, corpo);

  const cabecalhos = { Accept: 'application/json' };
  const token = obterToken();
  if (token) cabecalhos.Authorization = `Bearer ${token}`;
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';

  let resposta;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers: cabecalhos,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    return requestLocal(metodo, url, corpo);
  }

  if (resposta.status === 204) return null;

  const tipo = resposta.headers.get('content-type') || '';
  if (!tipo.includes('application/json')) return requestLocal(metodo, url, corpo);

  let dados = null;
  try {
    dados = await resposta.json();
  } catch {
    /* resposta sem corpo JSON */
  }

  if (!resposta.ok) {
    // Token vencido ou inválido: volta para o login (exceto na própria tela de login).
    if (resposta.status === 401 && token) {
      encerrarSessao();
      window.location.href = 'login.html?expirada=1';
    }
    throw new ErroApi(resposta.status, dados?.erro?.mensagem || 'Erro inesperado.', dados?.erro?.detalhes);
  }
  return dados;
}

export const api = {
  get: (caminho, parametros) => requisitar('GET', caminho, { parametros }),
  post: (caminho, corpo) => requisitar('POST', caminho, { corpo: corpo ?? {} }),
  put: (caminho, corpo) => requisitar('PUT', caminho, { corpo }),
  patch: (caminho, corpo) => requisitar('PATCH', caminho, { corpo: corpo ?? {} }),
  excluir: (caminho, parametros) => requisitar('DELETE', caminho, { parametros }),
};
