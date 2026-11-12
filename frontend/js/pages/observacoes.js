import { api } from '../core/api.js';
import { iniciarPagina } from '../core/layout.js';
import { CAMPOS_OBSERVACAO as CAMPOS } from '../core/formularios.js';
import { abrirFormulario, confirmar, tentar, estadoVazio } from '../core/ui.js';
import { esc, formatarDataHora, icone, opcoes, agoraParaInput, CATEGORIAS_OBSERVACAO } from '../core/formatadores.js';

async function principal() {
  const ctx = await iniciarPagina({ pagina: 'observacoes', titulo: 'Observações' });
  if (!ctx) return;
  const { idoso, podeEditar } = ctx;
  const base = `/idosos/${idoso.id}/observacoes`;
  let observacoes = [];

  const filtro = document.getElementById('filtroCategoria');
  filtro.innerHTML = '<option value="">Todas as categorias</option>' +
    opcoes(CATEGORIAS_OBSERVACAO).map((o) => `<option value="${o.valor}">${o.rotulo}</option>`).join('');

  if (podeEditar) {
    document.getElementById('acoes').innerHTML =
      '<button class="btn btn-primario" data-acao="novo"><i class="fa-solid fa-plus"></i> Nova observação</button>';
  }

  async function carregar() {
    observacoes = await api.get(base, { categoria: filtro.value });
    document.getElementById('lista').innerHTML = observacoes.length
      ? observacoes.map((o) => `
          <div class="item">
            <div class="item-icone"><i class="fa-solid ${icone(o.categoria)}"></i></div>
            <div class="item-corpo">
              <div class="item-titulo">${esc(o.titulo)} <span class="badge badge-neutro">${CATEGORIAS_OBSERVACAO[o.categoria]}</span></div>
              <div class="item-detalhe texto-quebra">${esc(o.texto)}</div>
              <div class="item-detalhe">${formatarDataHora(o.dataHora)}${o.autor ? ` · por ${esc(o.autor)}` : ''}</div>
            </div>
            ${podeEditar ? `
              <div class="item-acoes">
                <button class="btn-icone" data-acao="editar" data-id="${o.id}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icone perigo" data-acao="excluir" data-id="${o.id}" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button>
              </div>` : ''}
          </div>`).join('')
      : estadoVazio({ icone: 'fa-note-sticky', titulo: 'Nenhuma observação', texto: podeEditar ? 'Registre ocorrências e informações importantes do dia.' : '' });
  }

  const acoes = {
    async novo() {
      const salvou = await abrirFormulario({
        titulo: 'Nova observação',
        campos: CAMPOS,
        valores: { categoria: 'saude', dataHora: agoraParaInput() },
        aoSalvar: (valores) => api.post(base, valores),
      });
      if (salvou) tentar(carregar);
    },
    async editar(botao) {
      const observacao = observacoes.find((o) => o.id === Number(botao.dataset.id));
      const salvou = await abrirFormulario({
        titulo: 'Editar observação',
        campos: CAMPOS,
        valores: { ...observacao, dataHora: observacao.dataHora.slice(0, 16).replace(' ', 'T') },
        aoSalvar: (valores) => api.put(`${base}/${observacao.id}`, valores),
      });
      if (salvou) tentar(carregar);
    },
    async excluir(botao) {
      if (!(await confirmar('Excluir esta observação?', { textoConfirmar: 'Excluir', perigo: true }))) return;
      const { ok } = await tentar(() => api.excluir(`${base}/${botao.dataset.id}`), 'Observação excluída.');
      if (ok) tentar(carregar);
    },
  };

  document.getElementById('pagina').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao]');
    if (botao && acoes[botao.dataset.acao]) acoes[botao.dataset.acao](botao);
  });
  filtro.addEventListener('change', () => tentar(carregar));

  await tentar(carregar);
}

principal();
