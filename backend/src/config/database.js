// Conexão com PostgreSQL.
// Mantém a interface banco.consultar usada pelos repositories, traduzindo os
// placeholders legados "?" para "$1, $2..." e convertendo nomes snake_case.
const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.nome,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
});

const paraCamelCase = (texto) => texto.replace(/_([a-z])/g, (_, letra) => letra.toUpperCase());
function converterLinhas(linhas) {
  return linhas.map((linha) => Object.fromEntries(Object.entries(linha).map(([chave, valor]) => [paraCamelCase(chave), valor])));
}
function converterPlaceholders(sql) {
  let indice = 0;
  return sql.replace(/\?/g, () => `$${++indice}`);
}
function criarExecutor(origem) {
  return {
    async consultar(sql, parametros = []) {
      const ehInsert = /^\s*INSERT\s/i.test(sql);
      const texto = ehInsert && !/\bRETURNING\b/i.test(sql) ? `${sql} RETURNING id` : sql;
      const resultado = await origem.query(converterPlaceholders(texto), parametros);
      if (ehInsert) return { insertId: resultado.rows[0]?.id, affectedRows: resultado.rowCount, rows: converterLinhas(resultado.rows) };
      if (resultado.command === 'SELECT') return converterLinhas(resultado.rows);
      return { affectedRows: resultado.rowCount, rows: converterLinhas(resultado.rows || []) };
    },
  };
}
const banco = criarExecutor(pool);
async function transacao(operacao) {
  const conexao = await pool.connect();
  try { await conexao.query('BEGIN'); const resultado = await operacao(criarExecutor(conexao)); await conexao.query('COMMIT'); return resultado; }
  catch (erro) { await conexao.query('ROLLBACK'); throw erro; }
  finally { conexao.release(); }
}
module.exports = { banco, transacao, pool };
