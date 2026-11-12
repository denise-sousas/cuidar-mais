// Ponto de entrada: confere a conexão com o banco e abre a porta HTTP.
const env = require('./config/env');
const { banco } = require('./config/database');
const app = require('./app');

async function iniciar() {
  try {
    await banco.consultar('SELECT 1');
  } catch (erro) {
    console.error('\n[erro] Não foi possível conectar ao PostgreSQL:', erro.message);
    console.error('Confira o arquivo backend/.env e rode "npm run db:init" para criar as tabelas.\n');
    process.exit(1);
  }

  app.listen(env.porta, () => {
    console.log(`Cuidar+ rodando em http://localhost:${env.porta}`);
  });
}

iniciar();
