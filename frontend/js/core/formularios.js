// Formulários usados em mais de uma tela (registro rápido no dashboard + telas próprias).
import { api } from './api.js';
import { abrirFormulario } from './ui.js';
import { opcoes, agoraParaInput, TIPOS_REGISTRO, CATEGORIAS_OBSERVACAO } from './formatadores.js';

export const CAMPOS_REGISTRO = [
  { nome: 'tipo', rotulo: 'Tipo de registro', tipo: 'select', opcoes: opcoes(TIPOS_REGISTRO), obrigatorio: true },
  { nome: 'descricao', rotulo: 'Descrição', maxlength: 255, placeholder: 'Ex.: Almoço - arroz, feijão e frango', ajuda: 'Obrigatória para alimentação, higiene e atividade física.' },
  { nome: 'quantidadeMl', rotulo: 'Quantidade (ml)', tipo: 'number', min: 1, max: 3000, largura: 'metade', ajuda: 'Obrigatória para hidratação.' },
  { nome: 'dataHora', rotulo: 'Data e hora', tipo: 'datetime-local', largura: 'metade' },
];

export const CAMPOS_OBSERVACAO = [
  { nome: 'titulo', rotulo: 'Título', obrigatorio: true, maxlength: 100, placeholder: 'Ex.: Pressão alta pela manhã' },
  { nome: 'categoria', rotulo: 'Categoria', tipo: 'select', opcoes: opcoes(CATEGORIAS_OBSERVACAO), largura: 'metade' },
  { nome: 'dataHora', rotulo: 'Data e hora', tipo: 'datetime-local', largura: 'metade' },
  { nome: 'texto', rotulo: 'O que aconteceu?', tipo: 'textarea', obrigatorio: true, maxlength: 2000, rows: 5 },
];

// "base" = /idosos/:id
export const abrirNovoRegistro = ({ base, tipo = 'alimentacao', dataHora = agoraParaInput() }) =>
  abrirFormulario({
    titulo: 'Novo registro',
    campos: CAMPOS_REGISTRO,
    valores: { tipo, dataHora },
    aoSalvar: (valores) => api.post(`${base}/registros`, valores),
  });

export const abrirNovaObservacao = ({ base, categoria = 'saude' }) =>
  abrirFormulario({
    titulo: 'Nova observação',
    campos: CAMPOS_OBSERVACAO,
    valores: { categoria, dataHora: agoraParaInput() },
    aoSalvar: (valores) => api.post(`${base}/observacoes`, valores),
  });
