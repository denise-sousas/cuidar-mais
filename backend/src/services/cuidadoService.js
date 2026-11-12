// Regras de negócio: cuidados da rotina (itens programados com data e horário).
const AppError = require('../utils/AppError');
const { validar } = require('../utils/validadores');
const { lerData } = require('../utils/parametros');
const { adicionarDias, agoraSQL } = require('../utils/datas');
const { transacao } = require('../config/database');
const cuidadoRepository = require('../repositories/cuidadoRepository');

const TIPOS = ['higiene', 'alimentacao', 'hidratacao', 'atividade_fisica', 'sono', 'outro'];

const ESQUEMA = {
  titulo: { rotulo: 'Título', tipo: 'texto', obrigatorio: true, min: 2, max: 100 },
  descricao: { rotulo: 'Descrição', tipo: 'texto', max: 255 },
  tipo: { rotulo: 'Tipo', tipo: 'enum', opcoes: TIPOS, padrao: 'outro' },
  data: { rotulo: 'Data', tipo: 'data', obrigatorio: true },
  horario: { rotulo: 'Horário', tipo: 'hora', obrigatorio: true },
};

const listar = (idosoId, dataParametro) => cuidadoRepository.listarPorData(idosoId, lerData(dataParametro));

async function obter(idosoId, id) {
  const cuidado = await cuidadoRepository.buscar(idosoId, id);
  if (!cuidado) throw new AppError(404, 'Cuidado não encontrado.');
  return cuidado;
}

// "repetirDias" cria o mesmo cuidado nos N dias seguintes (ex.: 6 = uma semana inteira).
async function criar(idosoId, usuario, corpo) {
  const dados = validar(corpo, ESQUEMA);
  const { repetirDias } = validar(corpo, {
    repetirDias: { rotulo: 'Repetição', tipo: 'inteiro', min: 0, max: 60, padrao: 0 },
  });

  const ids = await transacao(async (db) => {
    const criados = [];
    for (let dia = 0; dia <= repetirDias; dia += 1) {
      criados.push(await cuidadoRepository.criar(idosoId, { ...dados, data: adicionarDias(dados.data, dia) }, usuario.id, db));
    }
    return criados;
  });
  return { criados: ids.length, primeiro: await obter(idosoId, ids[0]) };
}

async function atualizar(idosoId, id, corpo) {
  await obter(idosoId, id);
  await cuidadoRepository.atualizar(idosoId, id, validar(corpo, ESQUEMA));
  return obter(idosoId, id);
}

async function concluir(idosoId, id, usuario, corpo) {
  await obter(idosoId, id);
  const { concluido } = validar(corpo, {
    concluido: { rotulo: 'Situação', tipo: 'booleano', padrao: true },
  });
  await cuidadoRepository.definirConclusao(idosoId, id, { concluido, concluidoEm: agoraSQL(), usuarioId: usuario.id });
  return obter(idosoId, id);
}

async function excluir(idosoId, id) {
  await obter(idosoId, id);
  await cuidadoRepository.excluir(idosoId, id);
}

module.exports = { TIPOS, listar, obter, criar, atualizar, concluir, excluir };
