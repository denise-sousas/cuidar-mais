// Configuração do Express (sem abrir a porta; isso é feito em server.js).
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const rotas = require('./routes');
const { limitadorGeral } = require('./middlewares/limitadores');
const { rotaNaoEncontrada, tratadorDeErros } = require('./middlewares/erros');

const app = express();

app.disable('x-powered-by');
if (env.ambiente === 'production') app.set('trust proxy', 1); // necessário atrás de proxy (Render, etc.)

// Em desenvolvimento (http://localhost) não forçamos HTTPS nos recursos da página.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'upgrade-insecure-requests': env.ambiente === 'production' ? [] : null,
      },
    },
  })
);
if (env.corsOrigem) app.use(cors({ origin: env.corsOrigem.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/v1', limitadorGeral, rotas);

// O mesmo servidor entrega o frontend (pasta /frontend): basta rodar "npm start".
app.use(express.static(path.join(__dirname, '../../frontend')));

app.use(rotaNaoEncontrada);
app.use(tratadorDeErros);

module.exports = app;
