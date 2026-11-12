import { api } from '../core/api.js';
import { iniciarPagina, atualizarLembretes } from '../core/layout.js';
import { tentar, estadoVazio } from '../core/ui.js';
import { abrirNovoRegistro, abrirNovaObservacao } from '../core/formularios.js';
import {
  esc, formatarHora, formatarData, formatarDataHora, dataPorExtenso, hojeISO, icone, CATEGORIAS_OBSERVACAO,
} from '../core/formatadores.js';

async function principal() {
  const ctx = await iniciarPagina({ pagina: 'dashboard', titulo: 'Dashboard' });
  if (!ctx) return;
  const { usuario, idoso, podeEditar } = ctx;
  const base = `/idosos/${idoso.id}`;

  document.getElementById('nomeUsuario').textContent = usuario.nome.split(' ')[0];
  document.getElementById('subtitulo').textContent = `Acompanhando ${idoso.nome} · ${dataPorExtenso(hojeISO())}`;

  document.getElementById('acoes').innerHTML =
    '<a class="btn btn-primario" href="rotina.html"><i class="fa-solid fa-calendar-check"></i> Abrir rotina</a>';

  // Alergias e observações médicas ficam sempre à vista de quem cuida.
  if (idoso.observacoes) {
    document.getElementById('alertaIdoso').innerHTML =
      `<div class="alerta alerta-aviso"><i class="fa-solid fa-triangle-exclamation"></i> <strong>Alergias / observações médicas:</strong> ${esc(idoso.observacoes)}</div>`;
  }

  // Registro rápido (somente cuidador).
  if (podeEditar) {
    const area = document.getElementById('registroRapido');
    area.hidden = false;
    area.addEventListener('click', async (evento) => {
      const botao = evento.target.closest('[data-rapido]');
      if (!botao) return;
      const acao = botao.dataset.rapido;
      let salvou = false;
      if (acao === 'agua') {
        ({ ok: salvou } = await tentar(() => api.post(`${base}/registros`, { tipo: 'hidratacao', quantidadeMl: 200 }), 'Hidratação registrada (200 ml).'));
      } else if (acao === 'medicacao') {
        window.location.href = 'rotina.html';
        return;
      } else if (acao === 'ocorrencia') {
        salvou = await abrirNovaObservacao({ base });
      } else {
        salvou = await abrirNovoRegistro({ base, tipo: acao });
      }
      if (salvou) tentar(carregar);
    });
  }

  async function carregar() {
    const r = await api.get(`${base}/resumo`);

    const consulta = r.proximaConsulta;
    document.getElementById('estatisticas').innerHTML = `
      <div class="stat"><div class="stat-icone verde"><i class="fa-solid fa-list-check"></i></div>
        <div><strong>${r.cuidados.concluidos}/${r.cuidados.total}</strong><span>Cuidados de hoje</span></div></div>
      <div class="stat"><div class="stat-icone"><i class="fa-solid fa-pills"></i></div>
        <div><strong>${r.medicamentos.concluidos}/${r.medicamentos.total}</strong><span>Doses de hoje</span></div></div>
      <div class="stat"><div class="stat-icone"><i class="fa-solid fa-glass-water"></i></div>
        <div><strong>${r.registros.aguaMl} ml</strong><span>Água hoje (${r.registros.refeicoes} refeições)</span></div></div>
      <div class="stat"><div class="stat-icone laranja"><i class="fa-solid fa-stethoscope"></i></div>
        <div><strong>${consulta ? formatarData(consulta.data) : '—'}</strong>
        <span>${consulta ? `${esc(consulta.titulo)} às ${formatarHora(consulta.horario)}` : 'Nenhuma consulta marcada'}</span></div></div>`;

    document.getElementById('textoProgresso').textContent = `${r.progresso.concluidos} de ${r.progresso.total} (${r.progresso.percentual}%)`;
    document.getElementById('barraProgresso').style.width = `${r.progresso.percentual}%`;

    document.getElementById('pendentes').innerHTML = r.pendentes.length
      ? r.pendentes.map((i) => `
          <div class="item">
            <div class="item-hora">${formatarHora(i.horario)}</div>
            <div class="item-icone ${i.tipoItem === 'medicamento' ? 'verde' : ''}"><i class="fa-solid ${icone(i.subtipo)}"></i></div>
            <div class="item-corpo"><div class="item-titulo">${esc(i.titulo)}</div><div class="item-detalhe">${esc(i.detalhes)}</div></div>
          </div>`).join('')
      : estadoVazio({ icone: 'fa-circle-check', titulo: 'Tudo em dia!', texto: 'Não há itens pendentes para hoje.' });

    document.getElementById('observacoes').innerHTML = r.ultimasObservacoes.length
      ? r.ultimasObservacoes.map((o) => `
          <div class="item">
            <div class="item-icone"><i class="fa-solid ${icone(o.categoria)}"></i></div>
            <div class="item-corpo">
              <div class="item-titulo">${esc(o.titulo)} <span class="badge badge-neutro">${CATEGORIAS_OBSERVACAO[o.categoria]}</span></div>
              <div class="item-detalhe">${formatarDataHora(o.dataHora)}</div>
            </div>
          </div>`).join('')
      : estadoVazio({ icone: 'fa-note-sticky', titulo: 'Sem observações', texto: 'As anotações do dia aparecem aqui.' });
    atualizarLembretes();
  }

  await tentar(carregar);
}

principal();
