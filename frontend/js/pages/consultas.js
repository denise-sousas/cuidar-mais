import { api } from '../core/api.js';
import { iniciarPagina, atualizarLembretes } from '../core/layout.js';
import { abrirFormulario, confirmar, tentar, estadoVazio } from '../core/ui.js';
import { esc, hojeISO, formatarData, formatarHora } from '../core/formatadores.js';

const CAMPOS = [
  { nome: 'titulo', rotulo: 'Consulta, exame ou compromisso', obrigatorio: true, maxlength: 100, placeholder: 'Ex.: Cardiologista, Exame de sangue' },
  { nome: 'data', rotulo: 'Data', tipo: 'date', obrigatorio: true, largura: 'metade' },
  { nome: 'horario', rotulo: 'Horário', tipo: 'time', obrigatorio: true, largura: 'metade' },
  { nome: 'local', rotulo: 'Local', maxlength: 150, placeholder: 'Clínica, hospital, endereço...' },
  { nome: 'descricao', rotulo: 'Observações (opcional)', tipo: 'textarea', rows: 3, maxlength: 2000, ajuda: 'Ex.: levar exames anteriores, ir em jejum.' },
];

async function principal() {
  const ctx = await iniciarPagina({ pagina: 'consultas', titulo: 'Consultas' });
  if (!ctx) return;
  const { idoso, podeEditar } = ctx;
  const base = `/idosos/${idoso.id}/consultas`;
  let consultas = [];

  if (podeEditar) {
    document.getElementById('acoes').innerHTML =
      '<button class="btn btn-primario" data-acao="novo"><i class="fa-solid fa-plus"></i> Nova consulta</button>';
  }

  function htmlConsulta(c) {
    const passou = !c.realizada && c.data < hojeISO();
    return `
      <div class="item ${c.realizada ? 'concluido' : ''} ${passou ? 'atrasado' : ''}">
        <button type="button" class="marcador ${c.realizada ? 'marcado' : ''}" data-acao="alternar" data-id="${c.id}"
          ${podeEditar ? '' : 'disabled'} aria-label="${c.realizada ? 'Desmarcar como realizada' : 'Marcar como realizada'}"><i class="fa-solid fa-check"></i></button>
        <div class="item-hora">${formatarData(c.data).slice(0, 5)}<br><small class="texto-suave">${formatarHora(c.horario)}</small></div>
        <div class="item-corpo">
          <div class="item-titulo">${esc(c.titulo)} ${passou ? '<span class="badge badge-perigo">Data passada</span>' : ''}</div>
          <div class="item-detalhe">${formatarData(c.data)} às ${formatarHora(c.horario)}${c.local ? ` · ${esc(c.local)}` : ''}</div>
          ${c.descricao ? `<div class="item-detalhe texto-quebra">${esc(c.descricao)}</div>` : ''}
        </div>
        ${podeEditar ? `
          <div class="item-acoes">
            <button class="btn-icone" data-acao="editar" data-id="${c.id}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icone perigo" data-acao="excluir" data-id="${c.id}" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button>
          </div>` : ''}
      </div>`;
  }

  function desenhar() {
    const pendentes = consultas.filter((c) => !c.realizada);
    const realizadas = consultas.filter((c) => c.realizada).reverse();
    document.getElementById('pendentes').innerHTML = pendentes.length
      ? pendentes.map(htmlConsulta).join('')
      : estadoVazio({ icone: 'fa-calendar-plus', titulo: 'Nenhuma consulta pendente', texto: podeEditar ? 'Cadastre consultas e exames para não perder nenhum.' : '' });
    document.getElementById('realizadas').innerHTML = realizadas.length
      ? realizadas.map(htmlConsulta).join('')
      : '<p class="texto-suave">Nenhuma consulta realizada ainda.</p>';
  }

  async function carregar() {
    consultas = await api.get(base);
    desenhar();
  }

  const acoes = {
    async novo() {
      const salvou = await abrirFormulario({
        titulo: 'Nova consulta',
        campos: CAMPOS,
        valores: { data: hojeISO() },
        aoSalvar: (valores) => api.post(base, valores),
      });
      if (salvou) { carregar(); atualizarLembretes(); }
    },
    async editar(botao) {
      const consulta = consultas.find((c) => c.id === Number(botao.dataset.id));
      const salvou = await abrirFormulario({
        titulo: 'Editar consulta',
        campos: CAMPOS,
        valores: { ...consulta, horario: formatarHora(consulta.horario) },
        aoSalvar: (valores) => api.put(`${base}/${consulta.id}`, { ...valores, realizada: consulta.realizada }),
      });
      if (salvou) { carregar(); atualizarLembretes(); }
    },
    async alternar(botao) {
      const consulta = consultas.find((c) => c.id === Number(botao.dataset.id));
      const { ok } = await tentar(() => api.patch(`${base}/${consulta.id}/realizada`, { realizada: !consulta.realizada }));
      if (ok) { carregar(); atualizarLembretes(); }
    },
    async excluir(botao) {
      if (!(await confirmar('Excluir esta consulta?', { textoConfirmar: 'Excluir', perigo: true }))) return;
      const { ok } = await tentar(() => api.excluir(`${base}/${botao.dataset.id}`), 'Consulta excluída.');
      if (ok) { carregar(); atualizarLembretes(); }
    },
  };

  document.getElementById('pagina').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao]');
    if (botao && acoes[botao.dataset.acao]) acoes[botao.dataset.acao](botao);
  });

  await tentar(carregar);
}

principal();
