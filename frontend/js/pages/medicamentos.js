import { api } from '../core/api.js';
import { iniciarPagina, atualizarLembretes } from '../core/layout.js';
import { abrirFormulario, confirmar, tentar, estadoVazio } from '../core/ui.js';
import { esc, formatarHora } from '../core/formatadores.js';

const VIAS = ['Oral', 'Tópica (pele)', 'Inalatória', 'Injetável', 'Colírio / ocular', 'Sublingual', 'Outra']
  .map((via) => ({ valor: via, rotulo: via }));

const CAMPOS = [
  { nome: 'nome', rotulo: 'Nome do medicamento', obrigatorio: true, maxlength: 100 },
  { nome: 'dosagem', rotulo: 'Dosagem', largura: 'metade', maxlength: 50, placeholder: 'Ex.: 50 mg, 1 comprimido' },
  { nome: 'via', rotulo: 'Via de administração', tipo: 'select', largura: 'metade', opcoes: [{ valor: '', rotulo: 'Não informar' }, ...VIAS] },
  { nome: 'horarios', rotulo: 'Horários', tipo: 'horarios', obrigatorio: true, ajuda: 'Informe todos os horários do dia em que o medicamento deve ser administrado.' },
  { nome: 'observacoes', rotulo: 'Observações (opcional)', tipo: 'textarea', rows: 3, maxlength: 1000, ajuda: 'Ex.: tomar após o café, orientação do médico.' },
  { nome: 'ativo', rotulo: 'Em uso (desmarque para suspender)', tipo: 'checkbox' },
];

async function principal() {
  const ctx = await iniciarPagina({ pagina: 'medicamentos', titulo: 'Medicamentos' });
  if (!ctx) return;
  const { idoso, podeEditar } = ctx;
  const base = `/idosos/${idoso.id}/medicamentos`;
  let medicamentos = [];

  if (podeEditar) {
    document.getElementById('acoes').innerHTML =
      '<button class="btn btn-primario" data-acao="novo"><i class="fa-solid fa-plus"></i> Novo medicamento</button>';
  }

  function desenhar() {
    const lista = document.getElementById('lista');
    if (medicamentos.length === 0) {
      lista.innerHTML = estadoVazio({
        icone: 'fa-pills',
        titulo: 'Nenhum medicamento cadastrado',
        texto: podeEditar ? 'Cadastre os medicamentos e horários para receber lembretes.' : 'O cuidador ainda não cadastrou medicamentos.',
      });
      return;
    }
    lista.innerHTML = medicamentos.map((m) => `
      <div class="item ${m.ativo ? '' : 'concluido'}">
        <div class="item-icone"><i class="fa-solid fa-pills"></i></div>
        <div class="item-corpo">
          <div class="item-titulo">${esc(m.nome)} ${m.ativo ? '' : '<span class="badge badge-neutro">Suspenso</span>'}</div>
          <div class="item-detalhe">${esc([m.dosagem, m.via].filter(Boolean).join(' · ') || 'Dosagem não informada')}</div>
          <div class="chips">${m.horarios.map((h) => `<span class="chip">${formatarHora(h)}</span>`).join('')}</div>
          ${m.observacoes ? `<div class="item-detalhe texto-quebra">${esc(m.observacoes)}</div>` : ''}
        </div>
        ${podeEditar ? `
          <div class="item-acoes">
            <button class="btn-icone" data-acao="editar" data-id="${m.id}" aria-label="Editar ${esc(m.nome)}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icone perigo" data-acao="excluir" data-id="${m.id}" aria-label="Excluir ${esc(m.nome)}"><i class="fa-solid fa-trash"></i></button>
          </div>` : ''}
      </div>`).join('');
  }

  async function carregar() {
    medicamentos = await api.get(base);
    desenhar();
  }

  const acoes = {
    async novo() {
      const salvou = await abrirFormulario({
        titulo: 'Novo medicamento',
        campos: CAMPOS,
        valores: { ativo: true, horarios: [''] },
        aoSalvar: (valores) => api.post(base, valores),
      });
      if (salvou) { carregar(); atualizarLembretes(); }
    },
    async editar(botao) {
      const medicamento = medicamentos.find((m) => m.id === Number(botao.dataset.id));
      const salvou = await abrirFormulario({
        titulo: 'Editar medicamento',
        campos: CAMPOS,
        valores: medicamento,
        aoSalvar: (valores) => api.put(`${base}/${medicamento.id}`, valores),
      });
      if (salvou) { carregar(); atualizarLembretes(); }
    },
    async excluir(botao) {
      const medicamento = medicamentos.find((m) => m.id === Number(botao.dataset.id));
      const certeza = await confirmar(
        `Excluir "${medicamento.nome}" também apaga o registro das doses já administradas. Para apenas parar de usar, prefira editar e desmarcar "Em uso".`,
        { titulo: 'Excluir medicamento', textoConfirmar: 'Excluir', perigo: true }
      );
      if (!certeza) return;
      const { ok } = await tentar(() => api.excluir(`${base}/${medicamento.id}`), 'Medicamento excluído.');
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
