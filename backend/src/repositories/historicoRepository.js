// Histórico unificado: junta, em uma só linha do tempo, tudo o que foi REALIZADO
// (cuidados concluídos, doses administradas, registros, observações e consultas realizadas).
const { banco } = require('../config/database');
const { adicionarDias } = require('../utils/datas');

// Cada parte devolve as mesmas colunas: tipo, subtipo, id, titulo, detalhes, data_hora, autor.
const PARTES = {
  cuidado: `
    SELECT 'cuidado' AS tipo, c.tipo AS subtipo, c.id AS id, c.titulo AS titulo,
           COALESCE(c.descricao, '') AS detalhes, c.concluido_em AS data_hora, COALESCE(u.nome, '') AS autor
      FROM cuidados c
      LEFT JOIN usuarios u ON u.id = c.concluido_por
     WHERE c.idoso_id = ? AND c.concluido = 1 AND c.concluido_em IS NOT NULL`,
  medicamento: `
    SELECT 'medicamento' AS tipo, '' AS subtipo, a.id AS id, m.nome AS titulo,
           TRIM(COALESCE(m.dosagem, '') || ' - horário ' || TO_CHAR(a.horario, 'HH24:MI')) AS detalhes,
           a.administrado_em AS data_hora, COALESCE(u.nome, '') AS autor
      FROM administracoes_medicamento a
      JOIN medicamentos m ON m.id = a.medicamento_id
      LEFT JOIN usuarios u ON u.id = a.usuario_id
     WHERE a.idoso_id = ?`,
  registro: `
    SELECT 'registro' AS tipo, r.tipo AS subtipo, r.id AS id,
           CASE r.tipo WHEN 'alimentacao' THEN 'Alimentação' WHEN 'hidratacao' THEN 'Hidratação'
                       WHEN 'higiene' THEN 'Higiene' WHEN 'atividade_fisica' THEN 'Atividade física'
                       ELSE 'Registro' END AS titulo,
           CASE WHEN r.tipo = 'hidratacao' THEN COALESCE(r.quantidade_ml::text, '') || ' ml' ELSE COALESCE(r.descricao, '') END AS detalhes,
           r.data_hora AS data_hora, COALESCE(u.nome, '') AS autor
      FROM registros_cuidado r
      LEFT JOIN usuarios u ON u.id = r.usuario_id
     WHERE r.idoso_id = ?`,
  observacao: `
    SELECT 'observacao' AS tipo, o.categoria AS subtipo, o.id AS id, o.titulo AS titulo,
           o.texto AS detalhes, o.data_hora AS data_hora, COALESCE(u.nome, '') AS autor
      FROM observacoes o
      LEFT JOIN usuarios u ON u.id = o.usuario_id
     WHERE o.idoso_id = ?`,
  consulta: `
    SELECT 'consulta' AS tipo, '' AS subtipo, c.id AS id, c.titulo AS titulo,
           COALESCE(c.local, '') AS detalhes, (c.data + c.horario) AS data_hora, '' AS autor
      FROM consultas c
     WHERE c.idoso_id = ? AND c.realizada = 1`,
};

module.exports = {
  TIPOS: Object.keys(PARTES),

  async buscar(idosoId, { tipo, de, ate, limite, deslocamento }, db = banco) {
    const partes = tipo ? [PARTES[tipo]] : Object.values(PARTES);
    const uniao = partes.join(' UNION ALL ');
    const parametrosUniao = partes.map(() => idosoId);

    const condicoes = [];
    const parametrosFiltro = [];
    if (de) {
      condicoes.push('h.data_hora >= ?');
      parametrosFiltro.push(`${de} 00:00:00`);
    }
    if (ate) {
      condicoes.push('h.data_hora < ?');
      parametrosFiltro.push(`${adicionarDias(ate, 1)} 00:00:00`);
    }
    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

    const [contagem] = await db.consultar(
      `SELECT COUNT(*) AS total FROM (${uniao}) h ${where}`,
      [...parametrosUniao, ...parametrosFiltro]
    );
    const itens = await db.consultar(
      `SELECT h.* FROM (${uniao}) h ${where} ORDER BY h.data_hora DESC, h.id DESC LIMIT ? OFFSET ?`,
      [...parametrosUniao, ...parametrosFiltro, limite, deslocamento]
    );

    return { total: Number(contagem.total), itens };
  },
};
