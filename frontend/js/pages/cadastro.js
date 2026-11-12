import { api } from '../core/api.js';
import { salvarSessao, paginaInicial } from '../core/sessao.js';
import { ativarMostrarSenha } from '../core/ui.js';

const formulario = document.getElementById('formCadastro');
const caixaErro = document.getElementById('erro');
const botao = document.getElementById('botaoCadastrar');

ativarMostrarSenha();

// Máscara simples de CPF: 000.000.000-00
formulario.cpf.addEventListener('input', () => {
  const n = formulario.cpf.value.replace(/\D/g, '').slice(0, 11);
  formulario.cpf.value = n
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
});

function mostrarErro(mensagem) {
  caixaErro.textContent = mensagem;
  caixaErro.hidden = false;
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  caixaErro.hidden = true;

  if (formulario.cpf.value.replace(/\D/g, '').length !== 11) return mostrarErro('Informe o CPF com 11 números.');
  if (formulario.senha.value.length < 8) return mostrarErro('A senha deve ter no mínimo 8 caracteres.');
  if (formulario.senha.value !== formulario.confirmarSenha.value) return mostrarErro('As senhas não conferem.');

  botao.disabled = true;
  try {
    const sessao = await api.post('/auth/registro', {
      nome: formulario.nome.value,
      cpf: formulario.cpf.value,
      email: formulario.email.value,
      perfil: formulario.perfil.value,
      senha: formulario.senha.value,
    });
    salvarSessao(sessao);
    window.location.href = paginaInicial(sessao.usuario);
  } catch (erro) {
    mostrarErro(erro.detalhes ? Object.values(erro.detalhes).join(' ') : erro.message);
  } finally {
    botao.disabled = false;
  }
  return undefined;
});
