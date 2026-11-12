import { api } from '../core/api.js';
import { salvarSessao, obterToken, obterUsuario, paginaInicial } from '../core/sessao.js';
import { ativarMostrarSenha } from '../core/ui.js';
import { isLocalDemo, resetLocalDemo } from '../core/local-api.js';

const formulario = document.getElementById('formLogin');
const caixaErro = document.getElementById('erro');
const botao = document.getElementById('botaoEntrar');

// Já logado? Vai direto para o sistema.
if (obterToken() && obterUsuario()) window.location.href = paginaInicial(obterUsuario());

if (new URLSearchParams(window.location.search).has('expirada')) {
  caixaErro.textContent = 'Sua sessão expirou. Entre novamente.';
  caixaErro.hidden = false;
}

ativarMostrarSenha();

const restaurarDemo = document.getElementById('restaurarDemo');
if (isLocalDemo() && restaurarDemo) {
  restaurarDemo.hidden = false;
  restaurarDemo.addEventListener('click', () => {
    if (!window.confirm('Isso apagará as alterações salvas neste navegador e restaurará os dados iniciais de apresentação. Continuar?')) return;
    resetLocalDemo();
    window.location.reload();
  });
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  caixaErro.hidden = true;
  botao.disabled = true;
  try {
    const sessao = await api.post('/auth/login', {
      email: formulario.email.value,
      senha: formulario.senha.value,
    });
    salvarSessao(sessao);
    window.location.href = paginaInicial(sessao.usuario);
  } catch (erro) {
    caixaErro.textContent = erro.detalhes ? Object.values(erro.detalhes).join(' ') : erro.message;
    caixaErro.hidden = false;
  } finally {
    botao.disabled = false;
  }
});
