import { api } from '../core/api.js';
import { iniciarPagina } from '../core/layout.js';
import { tentar, estadoVazio } from '../core/ui.js';
import {
  esc, hojeISO, adicionarDias, formatarDataHora, icone, opcoes, TIPOS_HISTORICO,
} from '../core/formatadores.js';

const TAMANHO_PAGINA = 20;

async function principal() {
  const ctx = await iniciarPagina({ pagina: 'historico', titulo: 'Histórico' });
  if (!ctx) return;
  const base = `/idosos/${ctx.idoso.id}/historico`;
  let pagina = 1;

  const filtroDe = document.getElementById('filtroDe');
  const filtroAte = document.getElementById('filtroAte');
  const filtroTipo = document.getElementById('filtroTipo');
  filtroDe.value = adicionarDias(hojeISO(), -30);
  filtroAte.value = hojeISO();
  filtroTipo.innerHTML = '<option value="">Tudo</option>' +
    opcoes(TIPOS_HISTORICO).map((o) => `<option value="${o.valor}">${o.rotulo}</option>`).join('');

  const filtros = () => ({ de: filtroDe.value, ate: filtroAte.value, tipo: filtroTipo.value });

  async function carregar() {
    const r = await api.get(base, { ...filtros(), pagina, tamanho: TAMANHO_PAGINA });
    document.getElementById('lista').innerHTML = r.itens.length
      ? r.itens.map((i) => `
          <div class="item">
            <div class="item-icone"><i class="fa-solid ${icone(i.subtipo || i.tipo)}"></i></div>
            <div class="item-corpo">
              <div class="item-titulo">${esc(i.titulo)} <span class="badge badge-neutro">${esc(TIPOS_HISTORICO[i.tipo]?.split(' (')[0] || i.tipo)}</span></div>
              ${i.detalhes ? `<div class="item-detalhe texto-quebra">${esc(i.detalhes)}</div>` : ''}
              <div class="item-detalhe">${formatarDataHora(i.dataHora)}${i.autor ? ` · por ${esc(i.autor)}` : ''}</div>
            </div>
          </div>`).join('')
      : estadoVazio({ icone: 'fa-clock-rotate-left', titulo: 'Nenhum registro no período', texto: 'Ajuste os filtros para ver outros dias.' });

    document.getElementById('paginacao').innerHTML = `
      <span class="texto-suave">${r.total} registro(s) · página ${r.pagina} de ${r.totalPaginas}</span>
      <div class="linha-flex">
        <button class="btn btn-claro btn-pequeno" id="anterior" ${r.pagina <= 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i> Anterior</button>
        <button class="btn btn-claro btn-pequeno" id="proxima" ${r.pagina >= r.totalPaginas ? 'disabled' : ''}>Próxima <i class="fa-solid fa-chevron-right"></i></button>
      </div>`;
    document.getElementById('anterior').addEventListener('click', () => { pagina -= 1; tentar(carregar); });
    document.getElementById('proxima').addEventListener('click', () => { pagina += 1; tentar(carregar); });
  }

  // ---------- Exportar CSV (abre no Excel) ----------
  const celula = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;

  async function exportarCsv() {
    const linhas = [['Data e hora', 'Tipo', 'Título', 'Detalhes', 'Registrado por'].map(celula).join(';')];
    let paginaAtual = 1;
    let totalPaginas = 1;
    do {
      // eslint-disable-next-line no-await-in-loop
      const r = await api.get(base, { ...filtros(), pagina: paginaAtual, tamanho: 500 });
      r.itens.forEach((i) => linhas.push([i.dataHora, TIPOS_HISTORICO[i.tipo]?.split(' (')[0] || i.tipo, i.titulo, i.detalhes, i.autor].map(celula).join(';')));
      totalPaginas = r.totalPaginas;
      paginaAtual += 1;
    } while (paginaAtual <= totalPaginas);

    const blob = new Blob([`\uFEFF${linhas.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico-${ctx.idoso.nome.split(' ')[0].toLowerCase()}-${hojeISO()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  document.getElementById('botaoFiltrar').addEventListener('click', () => { pagina = 1; tentar(carregar); });
  document.getElementById('botaoCsv').addEventListener('click', () => tentar(exportarCsv, 'Arquivo gerado.'));
  document.getElementById('botaoImprimir').addEventListener('click', () => window.print());

  await tentar(carregar);
}

principal();
