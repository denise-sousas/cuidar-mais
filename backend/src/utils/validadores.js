// Validação e limpeza dos dados recebidos pela API.
// Uso: const dados = validar(req.body, { nome: { rotulo: 'Nome', tipo: 'texto', obrigatorio: true } });
// Se algo estiver errado, lança AppError(400) com os erros de cada campo.
const AppError = require('./AppError');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const REGEX_DATA_HORA = /^(\d{4}-\d{2}-\d{2})[T ]([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

function dataExiste(iso) {
  if (!REGEX_DATA.test(iso)) return false;
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

function cpfValido(cpf) {
  const n = String(cpf).replace(/\D/g, '');
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  const digito = (tamanho) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i += 1) soma += Number(n[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(n[9]) && digito(10) === Number(n[10]);
}

function formatarCpf(cpf) {
  const n = String(cpf).replace(/\D/g, '');
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

function formatarTelefone(telefone) {
  const n = String(telefone).replace(/\D/g, '');
  return n.length === 11
    ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
    : `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
}

// "8:00" não é aceito; "08:00" e "08:00:00" viram "08:00:00".
function normalizarHora(hora) {
  const m = REGEX_HORA.exec(String(hora).trim());
  return m ? `${m[1]}:${m[2]}:${m[3] || '00'}` : null;
}

// Valida a lista de horários de um medicamento (1 a 12 horários, sem repetir).
function normalizarHorarios(lista) {
  if (!Array.isArray(lista) || lista.length === 0) {
    throw new AppError(400, 'Dados inválidos.', { horarios: 'Informe ao menos um horário.' });
  }
  const horarios = lista.map(normalizarHora);
  if (horarios.some((h) => h === null)) {
    throw new AppError(400, 'Dados inválidos.', { horarios: 'Há um horário em formato inválido (use HH:mm).' });
  }
  const unicos = [...new Set(horarios)].sort();
  if (unicos.length > 12) {
    throw new AppError(400, 'Dados inválidos.', { horarios: 'Informe no máximo 12 horários.' });
  }
  return unicos;
}

function converter(valor, regra) {
  const { rotulo } = regra;
  switch (regra.tipo) {
    case 'texto': {
      const texto = String(valor);
      if (regra.min && texto.length < regra.min) return { erro: `${rotulo} deve ter no mínimo ${regra.min} caracteres.` };
      if (regra.max && texto.length > regra.max) return { erro: `${rotulo} deve ter no máximo ${regra.max} caracteres.` };
      return { valor: texto };
    }
    case 'email': {
      const email = String(valor).toLowerCase();
      if (!REGEX_EMAIL.test(email) || email.length > 150) return { erro: 'Informe um e-mail válido.' };
      return { valor: email };
    }
    case 'cpf':
      return cpfValido(valor) ? { valor: formatarCpf(valor) } : { erro: 'CPF inválido.' };
    case 'telefone': {
      const digitos = String(valor).replace(/\D/g, '');
      return digitos.length === 10 || digitos.length === 11
        ? { valor: formatarTelefone(digitos) }
        : { erro: 'Telefone inválido. Use DDD + número.' };
    }
    case 'data': {
      const data = String(valor);
      if (!dataExiste(data)) return { erro: `${rotulo} inválida (use AAAA-MM-DD).` };
      if (regra.naoFutura && data > new Date().toISOString().slice(0, 10)) {
        return { erro: `${rotulo} não pode ser futura.` };
      }
      return { valor: data };
    }
    case 'hora': {
      const hora = normalizarHora(valor);
      return hora ? { valor: hora } : { erro: `${rotulo} inválido (use HH:mm).` };
    }
    case 'dataHora': {
      const m = REGEX_DATA_HORA.exec(String(valor).trim());
      if (!m || !dataExiste(m[1])) return { erro: `${rotulo} inválida.` };
      return { valor: `${m[1]} ${m[2]}:${m[3]}:${m[4] || '00'}` };
    }
    case 'inteiro': {
      const numero = Number(valor);
      if (!Number.isInteger(numero)) return { erro: `${rotulo} deve ser um número inteiro.` };
      if (regra.min !== undefined && numero < regra.min) return { erro: `${rotulo} deve ser no mínimo ${regra.min}.` };
      if (regra.max !== undefined && numero > regra.max) return { erro: `${rotulo} deve ser no máximo ${regra.max}.` };
      return { valor: numero };
    }
    case 'booleano': {
      if ([true, 'true', 1, '1'].includes(valor)) return { valor: true };
      if ([false, 'false', 0, '0'].includes(valor)) return { valor: false };
      return { erro: `${rotulo} deve ser verdadeiro ou falso.` };
    }
    case 'enum':
      return regra.opcoes.includes(valor) ? { valor } : { erro: `${rotulo} inválido.` };
    default:
      throw new Error(`Tipo de validação desconhecido: ${regra.tipo}`);
  }
}

function validar(dados, esquema) {
  const origem = dados && typeof dados === 'object' ? dados : {};
  const limpo = {};
  const erros = {};

  Object.entries(esquema).forEach(([campo, regra]) => {
    let valor = origem[campo];
    if (typeof valor === 'string' && !regra.semTrim) valor = valor.trim();

    const vazio = valor === undefined || valor === null || valor === '';
    if (vazio) {
      if (regra.obrigatorio) erros[campo] = `${regra.rotulo} é obrigatório.`;
      else limpo[campo] = regra.padrao !== undefined ? regra.padrao : null;
      return;
    }

    const resultado = converter(valor, regra);
    if (resultado.erro) erros[campo] = resultado.erro;
    else limpo[campo] = resultado.valor;
  });

  if (Object.keys(erros).length > 0) throw new AppError(400, 'Dados inválidos.', erros);
  return limpo;
}

module.exports = { validar, cpfValido, formatarCpf, normalizarHora, normalizarHorarios, dataExiste };
