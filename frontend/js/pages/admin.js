import { api } from '../core/api.js';
import { iniciarPagina } from '../core/layout.js';
import { tentar, confirmar, estadoVazio, abrirFormulario, toast } from '../core/ui.js';
import { esc, formatarDataHora, PERFIS } from '../core/formatadores.js';

async function principal() {
  const ctx = await iniciarPagina({ pagina: 'admin', titulo: 'Administração', perfis: ['administrador'], exigeIdoso: false });
  if (!ctx) return;

  const busca = document.getElementById('busca');
  let usuarios = [];
  let temporizador;

  async function carregarEstatisticas() {
    const e = await api.get('/admin/estatisticas');
    document.getElementById('estatisticas').innerHTML = `
      <div class="stat"><div class="stat-icone"><i class="fa-solid fa-users"></i></div><div><strong>${e.usuarios}</strong><span>Usuários</span></div></div>
      <div class="stat"><div class="stat-icone verde"><i class="fa-solid fa-hand-holding-heart"></i></div><div><strong>${e.cuidadores}</strong><span>Cuidadores</span></div></div>
      <div class="stat"><div class="stat-icone"><i class="fa-solid fa-people-roof"></i></div><div><strong>${e.familiares}</strong><span>Familiares</span></div></div>
      <div class="stat"><div class="stat-icone laranja"><i class="fa-solid fa-person-cane"></i></div><div><strong>${e.idosos}</strong><span>Idosos cadastrados</span></div></div>
      <div class="stat"><div class="stat-icone laranja"><i class="fa-solid fa-user-slash"></i></div><div><strong>${e.inativos}</strong><span>Contas desativadas</span></div></div>`;
  }

  function desenhar() {
    const area = document.getElementById('usuarios');
    if (usuarios.length === 0) {
      area.innerHTML = estadoVazio({ icone: 'fa-users', titulo: 'Nenhum usuário encontrado' });
      return;
    }
    area.innerHTML = `
      <div class="tabela-wrap"><table class="tabela">
        <thead><tr><th>Nome</th><th>E-mail / CPF</th><th>Perfil</th><th>Cadastro</th><th>Situação</th></tr></thead>
        <tbody>${usuarios.map((u) => {
          const eu = u.id === ctx.usuario.id;
          return `<tr>
            <td>${esc(u.nome)} ${eu ? '<span class="badge">você</span>' : ''}</td>
            <td>${esc(u.email)}<br><small class="texto-suave">${esc(u.cpf || 'CPF não informado')}</small></td>
            <td><select class="controle" data-perfil="${u.id}" ${eu ? 'disabled' : ''} aria-label="Perfil de ${esc(u.nome)}">
              ${Object.entries(PERFIS).map(([valor, rotulo]) => `<option value="${valor}" ${valor === u.perfil ? 'selected' : ''}>${rotulo}</option>`).join('')}
            </select></td>
            <td>${formatarDataHora(u.criadoEm)}</td>
            <td>${eu ? '<span class="badge badge-sucesso">Ativo</span>' : `
              <button class="btn btn-pequeno ${u.ativo ? 'btn-claro' : 'btn-sucesso'}" data-ativo="${u.id}">
                ${u.ativo ? 'Desativar' : 'Reativar'}
              </button>`}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
  }

  async function carregar() {
    usuarios = await api.get('/admin/usuarios', { busca: busca.value });
    desenhar();
  }

  async function alterar(id, mudanca, mensagem) {
    const { ok } = await tentar(() => api.patch(`/admin/usuarios/${id}`, mudanca), mensagem);
    await tentar(() => Promise.all([carregar(), carregarEstatisticas()]));
    return ok;
  }

  document.getElementById('botaoNovo').addEventListener('click', async () => {
    const { ok, resultado: idosos } = await tentar(() => api.get('/admin/idosos'));
    if (!ok) return;
    let criado = null;
    const salvou = await abrirFormulario({
      titulo: 'Novo usuário',
      descricao: 'Cria uma conta de Cuidador ou Familiar. Informe a senha inicial à pessoa. Os vínculos com idosos são opcionais.',
      textoSalvar: 'Criar conta',
      campos: [
        { nome: 'nome', rotulo: 'Nome completo', obrigatorio: true, maxlength: 100 },
        { nome: 'cpf', rotulo: 'CPF', obrigatorio: true, largura: 'metade', placeholder: '000.000.000-00', maxlength: 14 },
        { nome: 'perfil', rotulo: 'Perfil', tipo: 'select', largura: 'metade', opcoes: [{ valor: 'cuidador', rotulo: 'Cuidador' }, { valor: 'familiar', rotulo: 'Familiar (somente leitura)' }] },
        { nome: 'email', rotulo: 'E-mail', tipo: 'email', obrigatorio: true, maxlength: 150 },
        { nome: 'senha', rotulo: 'Senha inicial (mín. 8 caracteres)', tipo: 'password', obrigatorio: true, maxlength: 72 },
        { nome: 'idosoIds', rotulo: 'Idosos que esta pessoa acompanha (opcional)', tipo: 'checklist', opcoes: idosos.map((i) => ({ valor: i.id, rotulo: i.nome })) },
      ],
      valores: { perfil: 'cuidador' },
      aoSalvar: async (valores) => { criado = await api.post('/admin/usuarios', valores); },
    });
    if (salvou) {
      toast(`Conta criada${criado.vinculosCriados ? ` e vinculada a ${criado.vinculosCriados} idoso(s)` : ''}.`);
      tentar(() => Promise.all([carregar(), carregarEstatisticas()]));
    }
  });

  document.getElementById('usuarios').addEventListener('change', (evento) => {
    const select = evento.target.closest('[data-perfil]');
    if (select) alterar(select.dataset.perfil, { perfil: select.value }, 'Perfil atualizado.');
  });

  document.getElementById('usuarios').addEventListener('click', async (evento) => {
    const botao = evento.target.closest('[data-ativo]');
    if (!botao) return;
    const usuario = usuarios.find((u) => u.id === Number(botao.dataset.ativo));
    const desativar = Boolean(usuario.ativo);
    if (desativar && !(await confirmar(`${usuario.nome} não conseguirá mais entrar no sistema.`, { titulo: 'Desativar conta', textoConfirmar: 'Desativar', perigo: true }))) return;
    alterar(usuario.id, { ativo: !desativar }, desativar ? 'Conta desativada.' : 'Conta reativada.');
  });

  busca.addEventListener('input', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => tentar(carregar), 300);
  });

  await tentar(() => Promise.all([carregar(), carregarEstatisticas()]));
}

principal();
