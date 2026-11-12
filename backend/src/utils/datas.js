// Funções de data/hora no fuso horário configurado (padrão: America/Sao_Paulo).
// Todas as datas trafegam como texto: "AAAA-MM-DD", "HH:mm:ss" e "AAAA-MM-DD HH:mm:ss".
const fuso = () => process.env.FUSO_HORARIO || 'America/Sao_Paulo';

function partes(data = new Date()) {
  const formatador = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  return Object.fromEntries(formatador.formatToParts(data).map((p) => [p.type, p.value]));
}

function hojeISO(data = new Date()) {
  const p = partes(data);
  return `${p.year}-${p.month}-${p.day}`;
}

function horaAtual(data = new Date()) {
  const p = partes(data);
  return `${p.hour}:${p.minute}:${p.second}`;
}

function agoraSQL(data = new Date()) {
  return `${hojeISO(data)} ${horaAtual(data)}`;
}

function adicionarDias(iso, dias) {
  const data = new Date(`${iso}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

// "08:30" ou "08:30:00" -> 510 (minutos desde 00:00)
function minutosDoDia(hora) {
  const [h, m] = String(hora).split(':').map(Number);
  return h * 60 + m;
}

module.exports = { hojeISO, horaAtual, agoraSQL, adicionarDias, minutosDoDia };
