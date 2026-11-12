import { api } from '../core/api.js';
import { iniciarPagina, atualizarLembretes } from '../core/layout.js';
import { abrirFormulario, confirmar, tentar, estadoVazio } from '../core/ui.js';
import {
  esc, hojeISO, adicionarDias, dataPorExtenso, formatarHora, icone, opcoes, TIPOS_CUIDADO,
} from '../core/formatadores.js';

const REPETICOES = [
  { valor: 0, rotulo: 'Não repetir' },
  { valor: 6, rotulo: 'Repetir pelos próximos 6 dias (1 semana)' },
  { valor: 13, rotulo: 'Repetir pelos próximos 13 dias (2 semanas)' },
  { valor: 29, rotulo: 'Repetir pelos próximos 29 dias (30 dias)' },
];

function campos(comRepeticao) {
  const lista = [
    { nome: 'titulo', rotulo: 'O que precisa ser feito?', obrigatorio: true, maxlength: 100, placeholder: 'Ex.: Banho, caminhada, lanche da tarde' },
    { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: opcoes(TIPOS_CUIDADO), largura: 'metade' },
    { nome: 'horario', rotulo: 'Horário', tipo: 'time', obrigatorio: true, largura: 'metade' },
    { nome: 'data', rotulo: 'Data', tipo: 'date', obrigatorio: true, largura: 'metade' },
    { nome: 'descricao', rotulo: 'Detalhes (opcional)', maxlength: 255 },
  ];
  if (comRepeticao) lista.splice(4, 0, { nome: 'repetirDias', rotulo: 'Repetição', tipo: 'select', opcoes: REPETICOES, largura: 'metade' });
  return lista;
}

async function principal() {
  const ctx = await iniciarPagina({ pagina: 'rotina', titulo: 'Rotina' });
  if (!ctx) return;
  const { idoso, podeEditar } = ctx;
  const base = `/idosos/${idoso.id}`;

  let data = hojeISO();
  let itens = [];

  const campoData = document.getElementById('campoData');
  const lista = document.getElementById('lista');

  if (podeEditar) {
    document.getElementById('acoes').innerHTML =
      '<button class="btn btn-primario" data-acao="novo"><i class="fa-solid fa-plus"></i> Novo cuidado</button>';
  }

  function htmlItem(item) {
    const agora = new Date().toTimeString().slice(0, 5);
    const atrasado = !item.concluido && data === hojeISO() && formatarHora(item.horario) < agora;
    const rotuloTipo = { medicamento: 'Medicamento', consulta: 'Consulta' }[item.tipoItem];
    const feitoPor = item.concluido && item.concluidoEm
      ? `Feito às ${item.concluidoEm.slice(11, 16)}${item.concluidoPor ? ` por ${esc(item.concluidoPor)}` : ''}`
      : '';
    return `
      <div class="item ${item.concluido ? 'concluido' : ''} ${atrasado ? 'atrasado' : ''}">
        <button type="button" class="marcador ${item.concluido ? 'marcado' : ''}" data-acao="alternar" data-chave="${esc(item.chave)}"
          ${podeEditar ? '' : 'disabled'} aria-label="${item.concluido ? 'Desmarcar' : 'Marcar como feito'}: ${esc(item.titulo)}"><i class="fa-solid fa-check"></i></button>
        <div class="item-hora">${formatarHora(item.horario)}</div>
        <div class="item-icone ${item.tipoItem === 'medicamento' ? 'verde' : ''}"><i class="fa-solid ${icone(item.subtipo)}"></i></div>
        <div class="item-corpo">
          <div class="item-titulo">${esc(item.titulo)} ${rotuloTipo ? `<span class="badge badge-neutro">${rotuloTipo}</span>` : ''} ${atrasado ? '<span class="badge badge-perigo">Atrasado</span>' : ''}</div>
          <div class="item-detalhe">${esc([item.detalhes, feitoPor].filter(Boolean).join(' · '))}</div>
        </div>
        ${podeEditar && item.tipoItem === 'cuidado' ? `
          <div class="item-acoes">
            <button class="btn-icone" data-acao="editar" data-chave="${esc(item.chave)}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icone perigo" data-acao="excluir" data-chave="${esc(item.chave)}" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button>
          </div>` : ''}
      </div>`;
  }

  async function carregar() {
    campoData.value = data;
    document.getElementById('dataExtenso').textContent = dataPorExtenso(data);

    const rotina = await api.get(`${base}/rotina`, { data });
    itens = rotina.itens;
    document.getElementById('resumo').innerHTML = `
      <span class="badge badge-sucesso">${rotina.resumo.concluidos} concluídos</span>
      <span class="badge badge-alerta">${rotina.resumo.pendentes} pendentes</span>`;

    lista.innerHTML = itens.length
      ? itens.map(htmlItem).join('')
      : estadoVazio({
          icone: 'fa-calendar-day',
          titulo: 'Nada programado para este dia',
          texto: podeEditar ? 'Use "Novo cuidado" ou cadastre medicamentos e consultas.' : 'O cuidador ainda não programou atividades.',
        });
  }

  const recarregar = () => tentar(carregar);
  const buscarItem = (chave) => itens.find((i) => i.chave === chave);

  const acoes = {
    async novo() {
      const salvou = await abrirFormulario({
        titulo: 'Novo cuidado',
        campos: campos(true),
        valores: { data, tipo: 'outro', repetirDias: 0 },
        aoSalvar: (valores) => api.post(`${base}/cuidados`, valores),
      });
      if (salvou) { carregar(); atualizarLembretes(); }
    },

    async editar(botao) {
      const item = buscarItem(botao.dataset.chave);
      const salvou = await abrirFormulario({
        titulo: 'Editar cuidado',
        campos: campos(false),
        valores: { titulo: item.titulo, tipo: item.subtipo, horario: formatarHora(item.horario), data, descricao: item.detalhes },
        aoSalvar: (valores) => api.put(`${base}/cuidados/${item.id}`, valores),
      });
      if (salvou) { carregar(); atualizarLembretes(); }
    },

    async excluir(botao) {
      const item = buscarItem(botao.dataset.chave);
      if (!(await confirmar(`Excluir "${item.titulo}"?`, { textoConfirmar: 'Excluir', perigo: true }))) return;
      const { ok } = await tentar(() => api.excluir(`${base}/cuidados/${item.id}`), 'Cuidado excluído.');
      if (ok) { carregar(); atualizarLembretes(); }
    },

    // Marca/desmarca como feito. A chamada depende do tipo do item.
    async alternar(botao) {
      const item = buscarItem(botao.dataset.chave);
      const dose = { medicamentoId: item.medicamentoId, horario: item.horario, data };
      const chamadas = {
        cuidado: () => api.patch(`${base}/cuidados/${item.id}/concluir`, { concluido: !item.concluido }),
        consulta: () => api.patch(`${base}/consultas/${item.id}/realizada`, { realizada: !item.concluido }),
        medicamento: () => (item.concluido
          ? api.excluir(`${base}/medicamentos/doses`, dose)
          : api.post(`${base}/medicamentos/doses`, dose)),
      };
      botao.disabled = true;
      const { ok } = await tentar(chamadas[item.tipoItem]);
      if (ok) { await carregar(); atualizarLembretes(); } else botao.disabled = false;
    },
  };

  document.getElementById('pagina').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao]');
    if (botao && acoes[botao.dataset.acao]) acoes[botao.dataset.acao](botao);
  });

  const irParaData = (novaData) => { data = novaData || hojeISO(); recarregar(); };
  document.getElementById('dataAnterior').addEventListener('click', () => irParaData(adicionarDias(data, -1)));
  document.getElementById('dataProxima').addEventListener('click', () => irParaData(adicionarDias(data, 1)));
  document.getElementById('dataHoje').addEventListener('click', () => irParaData(hojeISO()));
  campoData.addEventListener('change', () => irParaData(campoData.value));

  await recarregar();
}

principal();
