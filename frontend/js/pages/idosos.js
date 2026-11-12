import { api } from '../core/api.js';
import { iniciarPagina } from '../core/layout.js';
import { definirIdosoSelecionado } from '../core/sessao.js';
import { abrirFormulario, confirmar, tentar, toast, estadoVazio } from '../core/ui.js';
import { esc, calcularIdade, formatarData, formatarDataHora, hojeISO, PERFIS } from '../core/formatadores.js';

const CAMPOS = [
  { nome: 'nome', rotulo: 'Nome completo', obrigatorio: true, maxlength: 100, placeholder: 'Digite o nome completo' },
  { nome: 'dataNascimento', rotulo: 'Data de nascimento', tipo: 'date', obrigatorio: true, largura: 'metade', max: hojeISO() },
  { nome: 'cpf', rotulo: 'CPF', largura: 'metade', placeholder: '000.000.000-00', maxlength: 14 },
  { nome: 'telefone', rotulo: 'Telefone', tipo: 'tel', largura: 'metade', placeholder: '(00) 00000-0000' },
  { nome: 'endereco', rotulo: 'Endereço', maxlength: 255, placeholder: 'Rua, número, bairro...' },
  { nome: 'observacoes', rotulo: 'Alergias e observações médicas', tipo: 'textarea', maxlength: 2000, ajuda: 'Ex.: alergias, restrições alimentares, cuidados especiais.' },
];

async function principal() {
  const ctx = await iniciarPagina({ pagina: 'idosos', titulo: 'Idosos', exigeIdoso: false });
  if (!ctx) return;
  const { usuario, idosos } = ctx;
  const { idoso } = ctx;
  const ehCuidador = usuario.perfil === 'cuidador';

  const acoes = document.getElementById('acoes');
  acoes.innerHTML = `
    ${ehCuidador ? '<button class="btn btn-primario" data-acao="cadastrar"><i class="fa-solid fa-plus"></i> Cadastrar idoso</button>' : ''}
    <button class="btn btn-secundario" data-acao="vincular"><i class="fa-solid fa-link"></i> Entrar com código</button>`;

  // ---------- lista ----------
  function desenharLista() {
    const lista = document.getElementById('lista');
    if (idosos.length === 0) {
      lista.innerHTML = estadoVazio({
        icone: 'fa-person-cane',
        titulo: 'Nenhum idoso vinculado',
        texto: ehCuidador ? 'Cadastre o idoso ou entre com um código de vínculo.' : 'Peça o código de vínculo ao cuidador.',
      });
      return;
    }
    lista.innerHTML = idosos.map((i) => `
      <div class="item">
        <div class="item-icone"><i class="fa-solid fa-person-cane"></i></div>
        <div class="item-corpo">
          <div class="item-titulo">${esc(i.nome)}</div>
          <div class="item-detalhe">${calcularIdade(i.dataNascimento)} anos · você é ${PERFIS[i.papel].toLowerCase()}</div>
        </div>
        <div class="item-acoes">
          ${idoso && i.id === idoso.id
            ? '<span class="badge badge-sucesso"><i class="fa-solid fa-check"></i> Em acompanhamento</span>'
            : `<button class="btn btn-claro btn-pequeno" data-acao="selecionar" data-id="${i.id}">Acompanhar</button>`}
        </div>
      </div>`).join('');
  }

  // ---------- detalhe do idoso selecionado ----------
  async function desenharDetalhe() {
    const area = document.getElementById('detalhe');
    if (!idoso) { area.innerHTML = ''; return; }

    const dados = await api.get(`/idosos/${idoso.id}`);
    const ehCriador = dados.criadoPor === usuario.id;
    const ehCuidadorDoIdoso = dados.papel === 'cuidador';
    const vinculos = ehCuidadorDoIdoso ? await api.get(`/idosos/${idoso.id}/vinculos`) : [];
    const convites = ehCuidadorDoIdoso ? await api.get(`/idosos/${idoso.id}/convites`) : [];

    area.innerHTML = `
      <section class="cartao espaco-topo">
        <div class="cartao-cabecalho">
          <h2>${esc(dados.nome)}</h2>
          <div class="linha-flex">
            ${dados.papel === 'cuidador' ? '<button class="btn btn-claro btn-pequeno" data-acao="editar"><i class="fa-solid fa-pen"></i> Editar</button>' : ''}
            ${ehCriador ? '<button class="btn btn-claro btn-pequeno" data-acao="excluir"><i class="fa-solid fa-trash"></i> Excluir</button>' : ''}
            <button class="btn btn-claro btn-pequeno" data-acao="sair"><i class="fa-solid fa-right-from-bracket"></i> Deixar de acompanhar</button>
          </div>
        </div>
        <dl class="dados-grade">
          <div><dt>Nascimento</dt><dd>${formatarData(dados.dataNascimento)} (${calcularIdade(dados.dataNascimento)} anos)</dd></div>
          <div><dt>CPF</dt><dd>${esc(dados.cpf || '—')}</dd></div>
          <div><dt>Telefone</dt><dd>${esc(dados.telefone || '—')}</dd></div>
          <div><dt>Endereço</dt><dd>${esc(dados.endereco || '—')}</dd></div>
          <div style="grid-column:1/-1"><dt>Alergias e observações médicas</dt><dd class="texto-quebra">${esc(dados.observacoes || '—')}</dd></div>
        </dl>
      </section>
      ${dados.papel === 'cuidador' ? `
      <section class="cartao">
        <div class="cartao-cabecalho">
          <div><h2>Convidar pessoas</h2><p>Quem tiver este código pode se vincular ao idoso (cuidadores registram; familiares apenas consultam).</p></div>
        </div>
        <div class="linha-flex">
          <span class="codigo-vinculo" id="codigoVinculo">${esc(dados.codigoVinculo)}</span>
          <button class="btn btn-claro btn-pequeno" data-acao="copiar"><i class="fa-regular fa-copy"></i> Copiar</button>
          <button class="btn btn-claro btn-pequeno" data-acao="novo-codigo"><i class="fa-solid fa-rotate"></i> Gerar novo código</button>
        </div>
      </section>
      <section class="cartao">
        <div class="cartao-cabecalho">
          <div><h2>Autorizar familiar por e-mail</h2><p>O familiar precisa criar a conta como <strong>Familiar</strong> usando exatamente este e-mail. O Cuidar+ não envia e-mail: avise a pessoa.</p></div>
          <button class="btn btn-secundario btn-pequeno" data-acao="convidar"><i class="fa-solid fa-envelope"></i> Autorizar familiar</button>
        </div>
        ${convites.length ? `<div class="lista">${convites.map((c) => `
          <div class="item">
            <div class="item-icone"><i class="fa-solid fa-hourglass-half"></i></div>
            <div class="item-corpo"><div class="item-titulo">${esc(c.email)} <span class="badge badge-alerta">Aguardando cadastro</span></div>
              <div class="item-detalhe">Autorizado em ${formatarDataHora(c.criadoEm)}</div></div>
            <div class="item-acoes"><button class="btn-icone perigo" data-acao="cancelar-convite" data-id="${c.id}" aria-label="Cancelar autorização"><i class="fa-solid fa-xmark"></i></button></div>
          </div>`).join('')}</div>` : '<p class="texto-suave">Nenhuma autorização pendente.</p>'}
      </section>
      <section class="cartao">
        <div class="cartao-cabecalho"><h2>Pessoas vinculadas</h2></div>
        <div class="tabela-wrap"><table class="tabela">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Desde</th><th></th></tr></thead>
          <tbody>${vinculos.map((v) => `
            <tr>
              <td>${esc(v.nome)}${v.usuarioId === usuario.id ? ' <span class="badge">você</span>' : ''}</td>
              <td>${esc(v.email)}</td>
              <td><span class="badge ${v.papel === 'cuidador' ? '' : 'badge-neutro'}">${PERFIS[v.papel]}</span></td>
              <td>${formatarDataHora(v.vinculadoEm)}</td>
              <td>${v.usuarioId !== usuario.id ? `<button class="btn-icone perigo" data-acao="remover-vinculo" data-id="${v.usuarioId}" aria-label="Remover ${esc(v.nome)}"><i class="fa-solid fa-user-minus"></i></button>` : ''}</td>
            </tr>`).join('')}</tbody>
        </table></div>
      </section>` : ''}`;
  }

  // ---------- ações ----------
  const salvarNovoIdoso = (valores) => api.post('/idosos', valores);

  const acoesDaPagina = {
    async cadastrar() {
      let novo = null;
      const salvou = await abrirFormulario({
        titulo: 'Cadastrar idoso',
        campos: CAMPOS,
        aoSalvar: async (valores) => { novo = await salvarNovoIdoso(valores); },
      });
      if (salvou) { definirIdosoSelecionado(novo.id); toast('Idoso cadastrado!'); window.location.reload(); }
    },

    async vincular() {
      let vinculado = null;
      const salvou = await abrirFormulario({
        titulo: 'Entrar com código de vínculo',
        descricao: 'Digite o código que o cuidador responsável compartilhou com você.',
        textoSalvar: 'Vincular',
        campos: [{ nome: 'codigo', rotulo: 'Código', obrigatorio: true, placeholder: 'CUIDAR-XXXXXX', maxlength: 20 }],
        aoSalvar: async (valores) => { vinculado = await api.post('/idosos/vincular', valores); },
      });
      if (salvou) { definirIdosoSelecionado(vinculado.id); toast('Vínculo realizado!'); window.location.reload(); }
    },

    selecionar(botao) {
      definirIdosoSelecionado(botao.dataset.id);
      window.location.reload();
    },

    async editar() {
      const dados = await api.get(`/idosos/${idoso.id}`);
      const salvou = await abrirFormulario({
        titulo: 'Editar dados do idoso',
        campos: CAMPOS,
        valores: dados,
        aoSalvar: (valores) => api.put(`/idosos/${idoso.id}`, valores),
      });
      if (salvou) { toast('Dados atualizados.'); window.location.reload(); }
    },

    async excluir() {
      const certeza = await confirmar(
        `Excluir ${idoso.nome} apaga TODOS os registros ligados (rotina, medicamentos, histórico...). Isso não pode ser desfeito.`,
        { titulo: 'Excluir idoso', textoConfirmar: 'Excluir definitivamente', perigo: true }
      );
      if (!certeza) return;
      const { ok } = await tentar(() => api.excluir(`/idosos/${idoso.id}`), 'Idoso excluído.');
      if (ok) window.location.reload();
    },

    async sair() {
      if (!(await confirmar(`Deixar de acompanhar ${idoso.nome}?`, { textoConfirmar: 'Deixar de acompanhar' }))) return;
      const { ok } = await tentar(() => api.excluir(`/idosos/${idoso.id}/vinculos/${usuario.id}`), 'Você saiu do acompanhamento.');
      if (ok) window.location.reload();
    },

    async copiar() {
      const codigo = document.getElementById('codigoVinculo').textContent;
      try { await navigator.clipboard.writeText(codigo); toast('Código copiado!'); } catch { toast('Copie manualmente: ' + codigo, 'info'); }
    },

    async convidar() {
      let resposta = null;
      const salvou = await abrirFormulario({
        titulo: 'Autorizar familiar',
        descricao: 'Informe o e-mail que o familiar usa (ou usará) no Cuidar+. Ele terá acesso somente de leitura.',
        textoSalvar: 'Autorizar',
        campos: [{ nome: 'email', rotulo: 'E-mail do familiar', tipo: 'email', obrigatorio: true, maxlength: 150 }],
        aoSalvar: async (valores) => { resposta = await api.post(`/idosos/${idoso.id}/convites`, valores); },
      });
      if (!salvou) return;
      toast(resposta.situacao === 'vinculado'
        ? 'Familiar vinculado! Ele já pode acompanhar o idoso.'
        : 'Autorização registrada. Quando a pessoa criar a conta como Familiar com este e-mail, terá acesso.', 'info');
      desenharDetalhe();
    },

    async 'cancelar-convite'(botao) {
      const { ok } = await tentar(() => api.excluir(`/idosos/${idoso.id}/convites/${botao.dataset.id}`), 'Autorização cancelada.');
      if (ok) desenharDetalhe();
    },

    async 'novo-codigo'() {
      if (!(await confirmar('O código antigo deixará de funcionar. Quem já está vinculado continua com acesso.', { titulo: 'Gerar novo código' }))) return;
      const { ok } = await tentar(() => api.post(`/idosos/${idoso.id}/codigo`), 'Novo código gerado.');
      if (ok) desenharDetalhe();
    },

    async 'remover-vinculo'(botao) {
      if (!(await confirmar('Esta pessoa perderá o acesso ao idoso.', { titulo: 'Remover pessoa', textoConfirmar: 'Remover', perigo: true }))) return;
      const { ok } = await tentar(() => api.excluir(`/idosos/${idoso.id}/vinculos/${botao.dataset.id}`), 'Pessoa removida.');
      if (ok) desenharDetalhe();
    },
  };

  document.getElementById('pagina').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao]');
    if (botao && acoesDaPagina[botao.dataset.acao]) acoesDaPagina[botao.dataset.acao](botao);
  });

  desenharLista();
  await tentar(desenharDetalhe);
}

principal();
