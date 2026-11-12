// Componentes de interface reutilizáveis: avisos, confirmação, formulários em janela.
import { ErroApi } from './api.js';
import { esc, formatarHora } from './formatadores.js';

// ---------- Avisos (toast) ----------
export function toast(mensagem, tipo = 'sucesso') {
  let area = document.getElementById('avisos');
  if (!area) {
    area = document.createElement('div');
    area.id = 'avisos';
    area.setAttribute('aria-live', 'polite');
    document.body.appendChild(area);
  }
  const aviso = document.createElement('div');
  aviso.className = `aviso ${tipo === 'sucesso' ? '' : tipo}`;
  aviso.textContent = mensagem;
  area.appendChild(aviso);
  setTimeout(() => aviso.remove(), 4000);
}

// Executa uma ação e mostra o erro (se houver) em vez de quebrar a tela.
export async function tentar(acao, mensagemSucesso) {
  try {
    const resultado = await acao();
    if (mensagemSucesso) toast(mensagemSucesso);
    return { ok: true, resultado };
  } catch (erro) {
    toast(erro.message || 'Algo deu errado.', 'erro');
    return { ok: false, erro };
  }
}

// ---------- Estado vazio ----------
export function estadoVazio({ icone, titulo, texto = '', acao = '' }) {
  return `<div class="vazio"><i class="fa-solid ${icone}"></i><h3>${esc(titulo)}</h3><p>${esc(texto)}</p>${acao}</div>`;
}

// ---------- Janela de confirmação ----------
export function confirmar(mensagem, { titulo = 'Confirmar', textoConfirmar = 'Confirmar', perigo = false } = {}) {
  return new Promise((resolve) => {
    const dialogo = document.createElement('dialog');
    dialogo.className = 'modal';
    dialogo.innerHTML = `
      <div class="modal-corpo">
        <h2>${esc(titulo)}</h2>
        <p>${esc(mensagem)}</p>
        <div class="modal-rodape">
          <button type="button" class="btn btn-claro" data-resposta="nao">Cancelar</button>
          <button type="button" class="btn ${perigo ? 'btn-perigo' : 'btn-primario'}" data-resposta="sim">${esc(textoConfirmar)}</button>
        </div>
      </div>`;
    let resposta = false;
    dialogo.addEventListener('click', (evento) => {
      const botao = evento.target.closest('[data-resposta]');
      if (!botao) return;
      resposta = botao.dataset.resposta === 'sim';
      dialogo.close();
    });
    dialogo.addEventListener('close', () => {
      dialogo.remove();
      resolve(resposta);
    });
    document.body.appendChild(dialogo);
    dialogo.showModal();
  });
}

// ---------- Formulário em janela ----------
// campos: [{ nome, rotulo, tipo, obrigatorio, opcoes, placeholder, ajuda, largura, maxlength, min, max, rows }]
// tipos: text | textarea | select | date | time | datetime-local | number | tel | email | password | checkbox | horarios | checklist
function htmlLinhaHorario(valor = '') {
  return `<div class="horario-linha">
    <input type="time" class="controle horario-input" value="${esc(formatarHora(valor))}" required>
    <button type="button" class="btn-icone perigo" data-remover-horario aria-label="Remover horário"><i class="fa-solid fa-trash"></i></button>
  </div>`;
}

function htmlCampo(campo, valor) {
  const id = `campo-${campo.nome}`;
  const classe = `campo ${campo.largura === 'metade' ? '' : 'campo-inteiro'}`;
  const rotulo = `${esc(campo.rotulo)}${campo.obrigatorio ? ' <span class="obrigatorio">*</span>' : ''}`;
  const ajuda = campo.ajuda ? `<span class="ajuda">${esc(campo.ajuda)}</span>` : '';
  const atributos = [
    campo.placeholder ? `placeholder="${esc(campo.placeholder)}"` : '',
    campo.maxlength ? `maxlength="${campo.maxlength}"` : '',
    campo.min !== undefined ? `min="${esc(campo.min)}"` : '',
    campo.max !== undefined ? `max="${esc(campo.max)}"` : '',
  ].join(' ');

  if (campo.tipo === 'checkbox') {
    return `<label class="campo campo-inteiro campo-marcar"><input type="checkbox" id="${id}" ${valor ? 'checked' : ''}> <span class="rotulo">${esc(campo.rotulo)}</span></label>`;
  }
  if (campo.tipo === 'horarios') {
    const lista = Array.isArray(valor) && valor.length ? valor : [''];
    return `<div class="${classe}" data-campo-horarios="${campo.nome}">
      <span class="rotulo">${rotulo}</span>
      <div class="horarios-lista">${lista.map(htmlLinhaHorario).join('')}</div>
      <button type="button" class="btn btn-claro btn-pequeno" data-adicionar-horario><i class="fa-solid fa-plus"></i> Adicionar horário</button>
      ${ajuda}
    </div>`;
  }
  if (campo.tipo === 'checklist') {
    const marcados = Array.isArray(valor) ? valor.map(String) : [];
    const itens = campo.opcoes.length
      ? campo.opcoes.map((o) => `<label class="campo-marcar"><input type="checkbox" value="${esc(o.valor)}" ${marcados.includes(String(o.valor)) ? 'checked' : ''}> <span>${esc(o.rotulo)}</span></label>`).join('')
      : '<span class="ajuda">Nenhum item disponível.</span>';
    return `<fieldset class="${classe} checklist" data-campo-checklist="${campo.nome}"><legend class="rotulo">${rotulo}</legend>${itens}${ajuda}</fieldset>`;
  }
  if (campo.tipo === 'textarea') {
    return `<div class="${classe}"><label class="rotulo" for="${id}">${rotulo}</label><textarea class="controle" id="${id}" rows="${campo.rows || 4}" ${atributos}>${esc(valor ?? '')}</textarea>${ajuda}</div>`;
  }
  if (campo.tipo === 'select') {
    const opcoes = campo.opcoes
      .map((o) => `<option value="${esc(o.valor)}" ${String(o.valor) === String(valor ?? '') ? 'selected' : ''}>${esc(o.rotulo)}</option>`)
      .join('');
    return `<div class="${classe}"><label class="rotulo" for="${id}">${rotulo}</label><select class="controle" id="${id}">${opcoes}</select>${ajuda}</div>`;
  }
  return `<div class="${classe}"><label class="rotulo" for="${id}">${rotulo}</label><input class="controle" id="${id}" type="${campo.tipo || 'text'}" value="${esc(valor ?? '')}" ${atributos}>${ajuda}</div>`;
}

function lerValores(dialogo, campos) {
  const dados = {};
  campos.forEach((campo) => {
    if (campo.tipo === 'horarios') {
      dados[campo.nome] = [...dialogo.querySelectorAll(`[data-campo-horarios="${campo.nome}"] .horario-input`)]
        .map((input) => input.value)
        .filter(Boolean);
    } else if (campo.tipo === 'checklist') {
      dados[campo.nome] = [...dialogo.querySelectorAll(`[data-campo-checklist="${campo.nome}"] input:checked`)].map((input) => input.value);
    } else if (campo.tipo === 'checkbox') {
      dados[campo.nome] = dialogo.querySelector(`#campo-${campo.nome}`).checked;
    } else {
      dados[campo.nome] = dialogo.querySelector(`#campo-${campo.nome}`).value.trim();
    }
  });
  return dados;
}

// Abre o formulário e devolve uma Promise: true se salvou, false se cancelou.
// "aoSalvar(dados)" deve lançar erro (ErroApi) se a API recusar; o erro aparece na janela.
export function abrirFormulario({ titulo, descricao = '', campos, valores = {}, textoSalvar = 'Salvar', aoSalvar }) {
  return new Promise((resolve) => {
    const dialogo = document.createElement('dialog');
    dialogo.className = 'modal';
    dialogo.innerHTML = `
      <form class="modal-form" novalidate>
        <div class="modal-cabecalho">
          <h2>${esc(titulo)}</h2>
          <button type="button" class="btn-icone" data-fechar aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
        </div>
        ${descricao ? `<p class="modal-descricao">${esc(descricao)}</p>` : ''}
        <div class="alerta alerta-erro" data-erro role="alert" hidden></div>
        <div class="grade-form">${campos.map((c) => htmlCampo(c, valores[c.nome])).join('')}</div>
        <div class="modal-rodape">
          <button type="button" class="btn btn-claro" data-fechar>Cancelar</button>
          <button type="submit" class="btn btn-primario">${esc(textoSalvar)}</button>
        </div>
      </form>`;

    let salvou = false;
    const caixaErro = dialogo.querySelector('[data-erro]');
    const formulario = dialogo.querySelector('form');
    const botaoSalvar = dialogo.querySelector('[type="submit"]');

    dialogo.addEventListener('click', (evento) => {
      if (evento.target.closest('[data-fechar]')) dialogo.close();

      if (evento.target.closest('[data-adicionar-horario]')) {
        dialogo.querySelector('.horarios-lista').insertAdjacentHTML('beforeend', htmlLinhaHorario(''));
      }
      const remover = evento.target.closest('[data-remover-horario]');
      if (remover) {
        const lista = remover.closest('.horarios-lista');
        if (lista.children.length > 1) remover.closest('.horario-linha').remove();
        else lista.querySelector('input').value = '';
      }
    });

    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      caixaErro.hidden = true;
      dialogo.querySelectorAll('.invalido').forEach((el) => el.classList.remove('invalido'));

      // Confere os campos obrigatórios antes de chamar a API.
      const faltando = campos.filter((campo) => {
        if (!campo.obrigatorio) return false;
        if (campo.tipo === 'horarios') return lerValores(dialogo, [campo])[campo.nome].length === 0;
        const elemento = dialogo.querySelector(`#campo-${campo.nome}`);
        return !elemento || !elemento.value.trim();
      });
      if (faltando.length > 0) {
        faltando.forEach((c) => dialogo.querySelector(`#campo-${c.nome}`)?.classList.add('invalido'));
        caixaErro.textContent = `Preencha: ${faltando.map((c) => c.rotulo).join(', ')}.`;
        caixaErro.hidden = false;
        return;
      }

      botaoSalvar.disabled = true;
      try {
        await aoSalvar(lerValores(dialogo, campos));
        salvou = true;
        dialogo.close();
      } catch (erro) {
        const detalhes = erro instanceof ErroApi && erro.detalhes ? Object.values(erro.detalhes).join(' ') : '';
        caixaErro.textContent = detalhes || erro.message || 'Não foi possível salvar.';
        caixaErro.hidden = false;
        Object.keys(erro.detalhes || {}).forEach((nome) => dialogo.querySelector(`#campo-${nome}`)?.classList.add('invalido'));
      } finally {
        botaoSalvar.disabled = false;
      }
    });

    dialogo.addEventListener('close', () => {
      dialogo.remove();
      resolve(salvou);
    });

    document.body.appendChild(dialogo);
    dialogo.showModal();
    dialogo.querySelector('input, select, textarea')?.focus();
  });
}

// ---------- Botão de mostrar/ocultar senha ----------
export function ativarMostrarSenha() {
  document.querySelectorAll('[data-mostrar-senha]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const campo = document.getElementById(botao.dataset.mostrarSenha);
      const mostrar = campo.type === 'password';
      campo.type = mostrar ? 'text' : 'password';
      botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
      botao.querySelector('i').className = mostrar ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });
  });
}
