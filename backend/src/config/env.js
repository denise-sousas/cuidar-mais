// Carrega e valida as variáveis de ambiente (arquivo backend/.env).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const env = {
  ambiente: process.env.NODE_ENV || 'development',
  porta: Number(process.env.PORT) || 3000,
  fusoHorario: process.env.FUSO_HORARIO || 'America/Sao_Paulo',
  corsOrigem: process.env.CORS_ORIGIN || '',
  jwt: {
    segredo: process.env.JWT_SECRET,
    expiracao: process.env.JWT_EXPIRES_IN || '8h',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    nome: process.env.DB_NAME || 'cuidar_mais',
    ssl: String(process.env.DB_SSL || 'false').toLowerCase() === 'true',
  },
};

if (!env.jwt.segredo || env.jwt.segredo.length < 16) {
  throw new Error(
    'Defina JWT_SECRET (mínimo de 16 caracteres) no arquivo backend/.env. ' +
      'Use o arquivo .env.example como modelo.'
  );
}

module.exports = env;
