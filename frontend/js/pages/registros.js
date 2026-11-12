import { api } from '../core/api.js';
import { iniciarPagina } from '../core/layout.js';
import { CAMPOS_REGISTRO as CAMPOS } from '../core/formularios.js';
import { abrirFormulario, confirmar, tentar, estadoVazio } from '../core/ui.js';
import {
  esc, hojeISO, adicionarDias, agoraParaInput, dataPorExtenso, icone, opcoes, TIPOS_REGISTRO,
} from '../core/formatadores.js';

async function principal() {
  const ctx = await iniciarPagina({ pagina: 'registros', titulo: 'Alimentação e higiene' });
  if (!ctx) return;
  const { idoso, podeEditar } = ctx;
  const base = `/idosos/${idoso.id}/registros`;

  let data = hojeISO();
  let registros = [];
  const campoData = document.getElementById('campoData');
  const filtroTipo = document.getElementById('filtroTipo');
  filtroTipo.innerHTML = '<option value="">Todos os tipos</option>' +
    opcoes(TIPOS_REGISTRO).map((o) => `<option value="${o.valor}">${o.rotulo}</option>`).join('');

  if (podeEditar) {
    document.getElementById('acoes').innerHTML = `
      <button class="btn btn-secundario" data-acao="agua"><i class="fa-solid fa-glass-water"></i> +200 ml de água</button>
      <button class="btn btn-primario" data-acao="novo"><i class="fa-solid fa-plus"></i> Novo registro</button>`;
  }

  const horaPadrao = () => (data === hojeISO() ? agoraParaInput() : `${data}T12:00`);

  async function carregar() {
    campoData.value = data;
    document.getElementById('dataExtenso').textContent = dataPorExtenso(data);

    const [resumo, lista] = await Promise.all([
      api.get(`${base}/resumo`, { data }),
      api.get(base, { data, tipo: filtroTipo.value }),
    ]);
    registros = lista;

    document.getElementById('resumo').innerHTML = `
      <div class="stat"><div class="stat-icone"><i class="fa-solid fa-glass-water"></i></div><div><strong>${resumo.aguaMl} ml</strong><span>${resumo.hidratacoes} registros de água</span></div></div>
      <div class="stat"><div class="stat-icone verde"><i class="fa-solid fa-utensils"></i></div><div><strong>${resumo.refeicoes}</strong><span>Refeições</span></div></div>
      <div class="stat"><div class="stat-icone"><i class="fa-solid fa-soap"></i></div><div><strong>${resumo.higiene}</strong><span>Cuidados de higiene</span></div></div>
      <div class="stat"><div class="stat-icone laranja"><i class="fa-solid fa-person-walking"></i></div><div><strong>${resumo.atividadesFisicas}</strong><span>Atividades físicas</span></div></div>`;

    document.getElementById('lista').innerHTML = registros.length
      ? registros.map((r) => `
          <div class="item">
            <div class="item-hora">${r.dataHora.slice(11, 16)}</div>
            <div class="item-icone"><i class="fa-solid ${icone(r.tipo)}"></i></div>
            <div class="item-corpo">
              <div class="item-titulo">${TIPOS_REGISTRO[r.tipo]}${r.quantidadeMl ? ` · ${r.quantidadeMl} ml` : ''}</div>
              <div class="item-detalhe">${esc([r.descricao, r.autor && `por ${r.autor}`].filter(Boolean).join(' · '))}</div>
            </div>
            ${podeEditar ? `
              <div class="item-acoes">
                <button class="btn-icone" data-acao="editar" data-id="${r.id}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icone perigo" data-acao="excluir" data-id="${r.id}" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button>
              </div>` : ''}
          </div>`).join('')
      : estadoVazio({ icone: 'fa-utensils', titulo: 'Nenhum registro neste dia', texto: podeEditar ? 'Registre refeições, água, higiene e atividades.' : '' });
  }

  const recarregar = () => tentar(carregar);

  const acoes = {
    async agua() {
      const { ok } = await tentar(() => api.post(base, { tipo: 'hidratacao', quantidadeMl: 200 }), 'Hidratação registrada (200 ml).');
      if (ok) { data = hojeISO(); recarregar(); }
    },
    async novo() {
      const salvou = await abrirFormulario({
        titulo: 'Novo registro',
        campos: CAMPOS,
        valores: { tipo: 'alimentacao', dataHora: horaPadrao() },
        aoSalvar: (valores) => api.post(base, valores),
      });
      if (salvou) recarregar();
    },
    async editar(botao) {
      const registro = registros.find((r) => r.id === Number(botao.dataset.id));
      const salvou = await abrirFormulario({
        titulo: 'Editar registro',
        campos: CAMPOS,
        valores: { ...registro, dataHora: registro.dataHora.slice(0, 16).replace(' ', 'T') },
        aoSalvar: (valores) => api.put(`${base}/${registro.id}`, valores),
      });
      if (salvou) recarregar();
    },
    async excluir(botao) {
      if (!(await confirmar('Excluir este registro?', { textoConfirmar: 'Excluir', perigo: true }))) return;
      const { ok } = await tentar(() => api.excluir(`${base}/${botao.dataset.id}`), 'Registro excluído.');
      if (ok) recarregar();
    },
  };

  document.getElementById('pagina').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao]');
    if (botao && acoes[botao.dataset.acao]) acoes[botao.dataset.acao](botao);
  });

  const irParaData = (nova) => { data = nova || hojeISO(); recarregar(); };
  document.getElementById('dataAnterior').addEventListener('click', () => irParaData(adicionarDias(data, -1)));
  document.getElementById('dataProxima').addEventListener('click', () => irParaData(adicionarDias(data, 1)));
  document.getElementById('dataHoje').addEventListener('click', () => irParaData(hojeISO()));
  campoData.addEventListener('change', () => irParaData(campoData.value));
  filtroTipo.addEventListener('change', recarregar);

  await recarregar();
}

principal();
