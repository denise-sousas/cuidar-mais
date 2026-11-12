// Acesso ao banco: tabelas "idosos" e "vinculos".
const { banco } = require('../config/database');

module.exports = {
  async listarDoUsuario(usuarioId, db = banco) {
    return db.consultar(
      `SELECT i.*, v.papel
         FROM idosos i
         JOIN vinculos v ON v.idoso_id = i.id
        WHERE v.usuario_id = ?
        ORDER BY i.nome`,
      [usuarioId]
    );
  },

  // Apenas id e nome: usado pelo administrador para vincular contas (sem dados de saúde).
  async listarResumo(db = banco) {
    return db.consultar('SELECT id, nome FROM idosos ORDER BY nome');
  },

  async buscarPorId(id, db = banco) {
    const [idoso] = await db.consultar('SELECT * FROM idosos WHERE id = ?', [id]);
    return idoso || null;
  },

  async buscarPorCpf(cpf, db = banco) {
    const [idoso] = await db.consultar('SELECT id FROM idosos WHERE cpf = ?', [cpf]);
    return idoso || null;
  },

  async buscarPorCodigo(codigo, db = banco) {
    const [idoso] = await db.consultar('SELECT * FROM idosos WHERE codigo_vinculo = ?', [codigo]);
    return idoso || null;
  },

  async criar(dados, db = banco) {
    const resultado = await db.consultar(
      `INSERT INTO idosos (nome, data_nascimento, cpf, telefone, endereco, observacoes, codigo_vinculo, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [dados.nome, dados.dataNascimento, dados.cpf, dados.telefone, dados.endereco, dados.observacoes, dados.codigoVinculo, dados.criadoPor]
    );
    return resultado.insertId;
  },

  async atualizar(id, dados, db = banco) {
    await db.consultar(
      `UPDATE idosos
          SET nome = ?, data_nascimento = ?, cpf = ?, telefone = ?, endereco = ?, observacoes = ?
        WHERE id = ?`,
      [dados.nome, dados.dataNascimento, dados.cpf, dados.telefone, dados.endereco, dados.observacoes, id]
    );
  },

  async atualizarCodigo(id, codigo, db = banco) {
    await db.consultar('UPDATE idosos SET codigo_vinculo = ? WHERE id = ?', [codigo, id]);
  },

  async excluir(id, db = banco) {
    await db.consultar('DELETE FROM idosos WHERE id = ?', [id]);
  },

  // ----- vínculos -----
  async buscarVinculo(usuarioId, idosoId, db = banco) {
    const [vinculo] = await db.consultar('SELECT * FROM vinculos WHERE usuario_id = ? AND idoso_id = ?', [usuarioId, idosoId]);
    return vinculo || null;
  },

  async criarVinculo(usuarioId, idosoId, papel, db = banco) {
    await db.consultar('INSERT INTO vinculos (usuario_id, idoso_id, papel) VALUES (?, ?, ?)', [usuarioId, idosoId, papel]);
  },

  async removerVinculo(usuarioId, idosoId, db = banco) {
    await db.consultar('DELETE FROM vinculos WHERE usuario_id = ? AND idoso_id = ?', [usuarioId, idosoId]);
  },

  async listarVinculos(idosoId, db = banco) {
    return db.consultar(
      `SELECT u.id AS usuario_id, u.nome, u.email, v.papel, v.criado_em AS vinculado_em
         FROM vinculos v
         JOIN usuarios u ON u.id = v.usuario_id
        WHERE v.idoso_id = ?
        ORDER BY v.papel, u.nome`,
      [idosoId]
    );
  },

  async contarCuidadores(idosoId, db = banco) {
    const [linha] = await db.consultar("SELECT COUNT(*) AS total FROM vinculos WHERE idoso_id = ? AND papel = 'cuidador'", [idosoId]);
    return linha.total;
  },
};
