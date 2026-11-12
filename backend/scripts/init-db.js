// Cria o banco PostgreSQL (se ainda não existir) e todas as tabelas.
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const env = require('../src/config/env');

async function main() {
  const nome = env.db.nome.replace(/[^a-zA-Z0-9_]/g, '');
  if (!nome) throw new Error('DB_NAME inválido.');

  const administrador = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: 'postgres',
    ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  });
  await administrador.connect();
  const existente = await administrador.query('SELECT 1 FROM pg_database WHERE datname = $1', [nome]);
  if (existente.rowCount === 0) {
    await administrador.query(`CREATE DATABASE "${nome}"`);
    console.log(`Banco "${nome}" criado.`);
  }
  await administrador.end();

  const banco = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: nome,
    ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  });
  await banco.connect();
  const sql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
  await banco.query(sql);
  console.log(`Banco "${nome}" pronto. Tabelas criadas/verificadas com sucesso.`);
  await banco.end();
}

main().catch((erro) => {
  console.error('Falha ao preparar o banco PostgreSQL:', erro.message);
  process.exit(1);
});
