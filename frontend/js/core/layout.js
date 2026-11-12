// Monta a estrutura comum das telas internas (menu lateral, barra superior,
// seletor de idoso e sino de lembretes) e protege as páginas por perfil.
//
// Uso em cada página:
//   const ctx = await iniciarPagina({ pagina: 'rotina', titulo: 'Rotina' });
//   if (!ctx) return;   // usuário sem login, sem permissão ou sem idoso
import { api } from './api.js';
import {
  obterToken, obterUsuario, encerrarSessao, obterIdosoSelecionado,
  definirIdosoSelecionado, paginaInicial,
} from './sessao.js';
import { esc, iniciais, formatarHora, PERFIS, icone } from './formatadores.js';
import { toast, estadoVazio } from './ui.js';
import { isLocalDemo } from './local-api.js';

const MENU_CUIDADO = [
  { titulo: 'Principal' },
  { pagina: 'dashboard', href: 'dashboard.html', icone: 'fa-house', rotulo: 'Dashboard' },
  { pagina: 'idosos', href: 'idosos.html', icone: 'fa-person-cane', rotulo: 'Idosos' },
  { pagina: 'rotina', href: 'rotina.html', icone: 'fa-calendar-check', rotulo: 'Rotina' },
  { titulo: 'Cuidados' },
  { pagina: 'medicamentos', href: 'medicamentos.html', icone: 'fa-pills', rotulo: 'Medicamentos' },
  { pagina: 'registros', href: 'registros.html', icone: 'fa-utensils', rotulo: 'Alimentação e higiene' },
  { pagina: 'consultas', href: 'consultas.html', icone: 'fa-stethoscope', rotulo: 'Consultas' },
  { pagina: 'observacoes', href: 'observacoes.html', icone: 'fa-note-sticky', rotulo: 'Observações' },
  { pagina: 'historico', href: 'historico.html', icone: 'fa-clock-rotate-left', rotulo: 'Histórico' },
];
const MENU_ADMIN = [
  { titulo: 'Administração' },
  { pagina: 'admin', href: 'admin.html', icone: 'fa-user-shield', rotulo: 'Usuários e permissões' },
];

let recarregarLembretes = () => {};
// As telas chamam isto depois de concluir algo, para o sino atualizar na hora.
export const atualizarLembretes = () => recarregarLembretes();

function htmlMenu(itens, paginaAtual) {
  return itens
    .map((item) =>
      item.titulo
        ? `<div class="menu-titulo">${item.titulo}</div>`
        : `<a class="menu-link ${item.pagina === paginaAtual ? 'ativo' : ''}" href="${item.href}"><i class="fa-solid ${item.icone}"></i>${item.rotulo}</a>`
    )
    .join('');
}

function montarEstrutura({ pagina, titulo, usuario, perfilAdmin }) {
  const conteudo = document.getElementById('pagina');
  const casca = document.createElement('div');
  casca.className = 'app';
  casca.innerHTML = `
    <aside class="menu" id="menu">
      <a class="logo" href="${paginaInicial(usuario)}">
        <span class="logo-icone"><i class="fa-solid fa-heart-pulse"></i></span>
        <span>Cuidar<span>+</span></span>
      </a>
      ${htmlMenu(perfilAdmin ? MENU_ADMIN : MENU_CUIDADO, pagina)}
      <div class="menu-rodape">
        <div class="menu-usuario">
          <div class="avatar">${esc(iniciais(usuario.nome))}</div>
          <div><strong>${esc(usuario.nome)}</strong><small>${PERFIS[usuario.perfil] || ''}</small></div>
        </div>
        <button type="button" class="menu-link menu-botao" id="botaoSair"><i class="fa-solid fa-arrow-right-from-bracket"></i>Sair</button>
      </div>
    </aside>
    <div class="principal">
      <header class="topo">
        <div class="topo-esquerda">
          <button type="button" class="btn-icone botao-menu" id="botaoMenu" aria-label="Abrir menu"><i class="fa-solid fa-bars"></i></button>
          <strong>${esc(titulo)}</strong>
        </div>
        <div class="topo-direita" id="topoDireita"></div>
      </header>
      ${usuario.perfil === 'familiar'
        ? '<div class="faixa-leitura" role="status"><i class="fa-solid fa-eye"></i><span><strong>Modo de visualização · leitura.</strong> Acesso familiar autorizado: alterações indisponíveis.</span></div>'
        : ''}
      ${isLocalDemo()
        ? '<div class="faixa-demo" role="status"><i class="fa-solid fa-laptop"></i><span><strong>Ambiente de apresentação.</strong> Os dados ficam salvos somente neste navegador e não são sincronizados. Evite informações reais.</span></div>'
        : ''}
      <div class="conteudo" id="area"></div>
    </div>`;
  document.body.dataset.pagina = pagina;
  if (usuario.perfil === 'familiar') document.body.classList.add('perfil-familiar');
  document.body.prepend(casca);
  casca.querySelector('#area').appendChild(conteudo);

  casca.querySelector('#botaoSair').addEventListener('click', () => {
    encerrarSessao();
    window.location.href = 'login.html';
  });
  const menu = casca.querySelector('#menu');
  casca.querySelector('#botaoMenu').addEventListener('click', () => menu.classList.toggle('aberto'));
  document.addEventListener('click', (evento) => {
    if (menu.classList.contains('aberto') && !evento.target.closest('#menu, #botaoMenu')) menu.classList.remove('aberto');
  });
  return conteudo;
}

function escolherIdoso(idosos) {
  const salvo = obterIdosoSelecionado();
  const escolhido = idosos.find((i) => i.id === salvo) || idosos[0] || null;
  if (escolhido) definirIdosoSelecionado(escolhido.id);
  return escolhido;
}

function montarSeletorDeIdoso(idosos, idoso) {
  if (!idoso) return;
  const topo = document.getElementById('topoDireita');
  if (idosos.length > 1) {
    const select = document.createElement('select');
    select.className = 'seletor-idoso';
    select.setAttribute('aria-label', 'Idoso acompanhado');
    select.innerHTML = idosos.map((i) => `<option value="${i.id}" ${i.id === idoso.id ? 'selected' : ''}>${esc(i.nome)}</option>`).join('');
    select.addEventListener('change', () => {
      definirIdosoSelecionado(select.value);
      window.location.reload();
    });
    topo.appendChild(select);
  } else {
    topo.insertAdjacentHTML('beforeend', `<span class="badge"><i class="fa-solid fa-person-cane"></i> ${esc(idoso.nome)}</span>`);
  }
}

// ---------- Sino de lembretes ----------
function iniciarLembretes(idoso) {
  const topo = document.getElementById('topoDireita');
  const sino = document.createElement('div');
  sino.className = 'sino';
  sino.innerHTML = `
    <button type="button" class="btn-icone" id="botaoSino" aria-label="Lembretes" aria-expanded="false">
      <i class="fa-regular fa-bell"></i><span class="sino-contador" id="contadorSino" hidden>0</span>
    </button>
    <div class="painel-lembretes" id="painelLembretes" hidden></div>`;
  topo.appendChild(sino);

  const painel = sino.querySelector('#painelLembretes');
  const contador = sino.querySelector('#contadorSino');
  const botao = sino.querySelector('#botaoSino');
  let itens = [];

  const textoTempo = (item) => {
    if (item.situacao === 'atrasado') return `Atrasado há ${Math.abs(item.minutos)} min`;
    return item.minutos === 0 ? 'Agora' : `Em ${item.minutos} min`;
  };

  function desenhar() {
    contador.hidden = itens.length === 0;
    contador.textContent = itens.length;
    const permissao = 'Notification' in window ? Notification.permission : 'indisponivel';
    painel.innerHTML = `
      <h3>Lembretes de agora</h3>
      ${itens.length === 0
        ? '<p class="texto-suave">Nada pendente para os próximos 30 minutos. 🎉</p>'
        : `<div class="lista">${itens.map((i) => `
            <div class="item ${i.situacao === 'atrasado' ? 'atrasado' : ''}">
              <div class="item-icone"><i class="fa-solid ${icone(i.subtipo)}"></i></div>
              <div class="item-corpo">
                <div class="item-titulo">${esc(i.titulo)}</div>
                <div class="item-detalhe">${formatarHora(i.horario)} · ${textoTempo(i)}</div>
              </div>
            </div>`).join('')}</div>`}
      ${permissao === 'default' ? '<p style="margin-top:12px"><button type="button" class="btn btn-secundario btn-pequeno" id="ativarAvisos">Ativar avisos no navegador</button></p>' : ''}`;
    painel.querySelector('#ativarAvisos')?.addEventListener('click', async () => {
      await Notification.requestPermission();
      desenhar();
    });
  }

  // Avisa (uma vez por item) quando algo está para acontecer ou atrasou.
  function avisarNovos() {
    const chaveStorage = 'cuidar.avisados';
    let avisados = [];
    try { avisados = JSON.parse(sessionStorage.getItem(chaveStorage)) || []; } catch { /* ignora */ }
    const novos = itens.filter((i) => !avisados.includes(`${i.chave}-${i.situacao}`));
    novos.forEach((i) => {
      toast(`${formatarHora(i.horario)} - ${i.titulo}: ${textoTempo(i)}`, 'info');
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Cuidar+: ${i.titulo}`, { body: `${formatarHora(i.horario)} · ${textoTempo(i)}` });
      }
    });
    sessionStorage.setItem(chaveStorage, JSON.stringify([...avisados, ...novos.map((i) => `${i.chave}-${i.situacao}`)]));
  }

  async function buscar() {
    try {
      const resposta = await api.get(`/idosos/${idoso.id}/lembretes`, { antecedencia: 30 });
      itens = resposta.itens;
      desenhar();
      avisarNovos();
    } catch {
      /* falha silenciosa: o sino tenta de novo no próximo minuto */
    }
  }

  botao.addEventListener('click', () => {
    painel.hidden = !painel.hidden;
    botao.setAttribute('aria-expanded', String(!painel.hidden));
  });
  document.addEventListener('click', (evento) => {
    if (!evento.target.closest('.sino')) painel.hidden = true;
  });

  recarregarLembretes = buscar;
  desenhar();
  buscar();
  setInterval(buscar, 60 * 1000);
}

export async function iniciarPagina({ pagina, titulo, perfis = ['cuidador', 'familiar'], exigeIdoso = true }) {
  const usuario = obterUsuario();
  if (!obterToken() || !usuario) {
    window.location.href = 'login.html';
    return null;
  }
  if (!perfis.includes(usuario.perfil)) {
    window.location.href = paginaInicial(usuario);
    return null;
  }

  const perfilAdmin = usuario.perfil === 'administrador';
  const conteudo = montarEstrutura({ pagina, titulo, usuario, perfilAdmin });

  if (perfilAdmin) {
    conteudo.hidden = false;
    return { usuario, idoso: null, idosos: [], podeEditar: false };
  }

  let idosos = [];
  try {
    idosos = await api.get('/idosos');
  } catch (erro) {
    toast(erro.message, 'erro');
  }
  const idoso = escolherIdoso(idosos);
  montarSeletorDeIdoso(idosos, idoso);

  if (!idoso && exigeIdoso) {
    const acao = '<a class="btn btn-primario" href="idosos.html"><i class="fa-solid fa-person-cane"></i> Ir para Idosos</a>';
    conteudo.innerHTML = `<div class="cartao">${estadoVazio({
      icone: 'fa-person-cane',
      titulo: 'Nenhum idoso por aqui ainda',
      texto: usuario.perfil === 'cuidador'
        ? 'Cadastre o idoso que você acompanha ou use um código de vínculo.'
        : 'Peça ao cuidador o código de vínculo para acompanhar o idoso.',
      acao,
    })}</div>`;
    conteudo.hidden = false;
    return null;
  }

  conteudo.hidden = false;
  if (idoso) iniciarLembretes(idoso);
  return { usuario, idoso, idosos, podeEditar: Boolean(idoso) && idoso.papel === 'cuidador' };
}
