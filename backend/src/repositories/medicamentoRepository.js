// Acesso ao banco: "medicamentos", "horarios_medicamento" e "administracoes_medicamento".
const { banco } = require('../config/database');

async function anexarHorarios(medicamentos, db) {
  if (medicamentos.length === 0) return medicamentos;
  const horarios = await db.consultar(
    'SELECT medicamento_id, horario FROM horarios_medicamento WHERE medicamento_id = ANY(?) ORDER BY horario',
    [medicamentos.map((m) => m.id)]
  );
  return medicamentos.map((m) => ({
    ...m,
    ativo: Boolean(m.ativo),
    horarios: horarios.filter((h) => h.medicamentoId === m.id).map((h) => h.horario),
  }));
}

module.exports = {
  async listar(idosoId, db = banco) {
    const medicamentos = await db.consultar('SELECT * FROM medicamentos WHERE idoso_id = ? ORDER BY ativo DESC, nome', [idosoId]);
    return anexarHorarios(medicamentos, db);
  },
  async buscar(idosoId, id, db = banco) {
    const medicamentos = await db.consultar('SELECT * FROM medicamentos WHERE idoso_id = ? AND id = ?', [idosoId, id]);
    const [medicamento] = await anexarHorarios(medicamentos, db);
    return medicamento || null;
  },
  async criar(idosoId, dados, db = banco) {
    const resultado = await db.consultar(
      'INSERT INTO medicamentos (idoso_id, nome, dosagem, via, observacoes, ativo) VALUES (?, ?, ?, ?, ?, ?)',
      [idosoId, dados.nome, dados.dosagem, dados.via, dados.observacoes, dados.ativo ? 1 : 0]
    );
    return resultado.insertId;
  },
  async atualizar(idosoId, id, dados, db = banco) {
    await db.consultar('UPDATE medicamentos SET nome = ?, dosagem = ?, via = ?, observacoes = ?, ativo = ? WHERE idoso_id = ? AND id = ?',
      [dados.nome, dados.dosagem, dados.via, dados.observacoes, dados.ativo ? 1 : 0, idosoId, id]);
  },
  async excluir(idosoId, id, db = banco) {
    await db.consultar('DELETE FROM medicamentos WHERE idoso_id = ? AND id = ?', [idosoId, id]);
  },
  async substituirHorarios(medicamentoId, horarios, db = banco) {
    await db.consultar('DELETE FROM horarios_medicamento WHERE medicamento_id = ?', [medicamentoId]);
    if (horarios.length === 0) return;
    const valores = horarios.map((_, indice) => `($${indice * 2 + 1}, $${indice * 2 + 2})`).join(', ');
    const parametros = horarios.flatMap((horario) => [medicamentoId, horario]);
    await db.consultar(`INSERT INTO horarios_medicamento (medicamento_id, horario) VALUES ${valores}`, parametros);
  },
  async agendaDoDia(idosoId, data, db = banco) {
    return db.consultar(
      `SELECT m.id AS medicamento_id, m.nome, m.dosagem, m.via, h.horario,
              a.id AS administracao_id, a.administrado_em, u.nome AS administrado_por
         FROM medicamentos m
         JOIN horarios_medicamento h ON h.medicamento_id = m.id
         LEFT JOIN administracoes_medicamento a
                ON a.medicamento_id = m.id AND a.horario = h.horario AND a.data = ?
         LEFT JOIN usuarios u ON u.id = a.usuario_id
        WHERE m.idoso_id = ? AND m.ativo = 1
        ORDER BY h.horario, m.nome`, [data, idosoId]);
  },
  async horarioExiste(idosoId, medicamentoId, horario, db = banco) {
    const [linha] = await db.consultar(`SELECT 1 AS existe FROM horarios_medicamento h JOIN medicamentos m ON m.id = h.medicamento_id WHERE m.id = ? AND m.idoso_id = ? AND h.horario = ?`, [medicamentoId, idosoId, horario]);
    return Boolean(linha);
  },
  async registrarDose({ idosoId, medicamentoId, horario, data, administradoEm, usuarioId }, db = banco) {
    await db.consultar(
      `INSERT INTO administracoes_medicamento (idoso_id, medicamento_id, horario, data, administrado_em, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (medicamento_id, horario, data) DO NOTHING`,
      [idosoId, medicamentoId, horario, data, administradoEm, usuarioId]
    );
  },
  async desfazerDose({ idosoId, medicamentoId, horario, data }, db = banco) {
    await db.consultar('DELETE FROM administracoes_medicamento WHERE idoso_id = ? AND medicamento_id = ? AND horario = ? AND data = ?', [idosoId, medicamentoId, horario, data]);
  },
};
