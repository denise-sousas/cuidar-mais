# Cuidar+

Sistema web para **organizar e acompanhar a rotina de cuidados de pessoas idosas**: medicamentos e
horários, rotina diária, alimentação/hidratação/higiene, consultas, observações, histórico e
acompanhamento por familiares.

> O Cuidar+ **apenas organiza e registra**. Decisões sobre saúde, tratamento e medicação
> continuam sendo dos profissionais responsáveis.

Projeto da disciplina **Fábrica de Software I - UEG (Sistemas para Internet)**.

---

## Como rodar (Visual Studio Code)

### Demonstração sem PostgreSQL (mais simples para apresentação)

1. Abra no VS Code a pasta `Cuidar+` extraída do ZIP.
2. No Explorer, abra `frontend/index.html` e clique em **Go Live** (extensão Live Server). Se a extensão não estiver instalada, peça autorização para instalá-la ou use outro servidor estático aprovado pela instituição.
3. Na página inicial, clique em **Entrar**. Quando o navegador não encontrar a API, o Cuidar+ ativa automaticamente o modo de demonstração e salva os dados no armazenamento deste navegador.
4. Use qualquer uma das contas mostradas na tela de login. A senha inicial das três é **`Cuidar@123`**.

O modo local não precisa de Node.js, backend ou PostgreSQL. Os ícones também estão incluídos no projeto, então a interface não depende de acesso a uma CDN. As alterações ficam apenas no navegador e computador usados na apresentação; os dados não são sincronizados. O armazenamento local é somente para fins acadêmicos: use dados fictícios, não cadastre dados pessoais ou de saúde reais. Para restaurar a demonstração, saia da conta, clique em **Restaurar dados iniciais da demonstração** na tela de login e confirme.

Os e-mails terminados em `.local` listados na tela são contas fictícias do Cuidar+ para demonstração; não são usuários do Windows, do pgAdmin nem do PostgreSQL.

### Modo integrado com PostgreSQL (pgAdmin)

O banco usado pelo backend é PostgreSQL. O pgAdmin é a ferramenta de administração; o servidor PostgreSQL precisa estar instalado e em execução. Crie o banco `cuidar_mais` no pgAdmin ou deixe `npm run db:init` criá-lo automaticamente.

Para persistência no servidor, é necessário Node.js 18.18 ou superior e PostgreSQL 13 ou superior em execução. Abra o terminal do VS Code na pasta `Cuidar+` e execute:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edite `backend/.env`: informe a senha que você criou para o usuário do PostgreSQL em `DB_PASSWORD` e substitua `JWT_SECRET` por um texto aleatório longo. Em seguida, com o serviço PostgreSQL ativo, execute:

```powershell
npm run db:init
npm run db:seed
npm start
```

Abra **http://localhost:3000**. O backend entrega a interface e a API. Se já usou uma versão anterior do banco, `npm run db:init` atualiza o esquema sem apagar os dados existentes.

Contas criadas pelo `db:seed` (senha **Cuidar@123**):

| Perfil | E-mail |
|---|---|
| Administrador | admin@cuidar.local |
| Cuidadora | cuidadora@cuidar.local |
| Familiar | familiar@cuidar.local |

Código de vínculo do idoso de demonstração: `CUIDAR-DEMO23`.
Também existe uma **autorização pendente** de exemplo: cadastre-se como *Familiar* com o e-mail
`neto@cuidar.local` e o acesso ao idoso demo já vem liberado.

Para criar o seu próprio administrador:

```bash
npm run admin:criar -- "Seu Nome" seu@email.com SuaSenhaForte123 52998224725   # CPF é opcional
```

### Scripts (dentro de `backend/`)

| Comando | O que faz |
|---|---|
| `npm start` | Inicia o servidor |
| `npm run dev` | Inicia reiniciando sozinho ao salvar arquivos |
| `npm run db:init` | Cria o banco e as tabelas (pode repetir sem medo) |
| `npm run db:seed` | Dados de demonstração (apenas desenvolvimento) |
| `npm run admin:criar` | Cria/promove um administrador |
| `npm test` | Testes automatizados (validações e datas) |

No VS Code também dá para depurar com **F5** (configuração em `.vscode/launch.json`).

---

## Estrutura do projeto

```
Cuidar+/
├── backend/
│   ├── database/schema.sql        # tabelas do PostgreSQL
│   ├── scripts/                   # init-db, seed, criar-admin
│   ├── tests/                     # testes automatizados
│   └── src/
│       ├── server.js / app.js     # inicialização e configuração do Express
│       ├── config/                # variáveis de ambiente e conexão com o banco
│       ├── routes/                # URLs da API
│       ├── controllers/           # HTTP: lê a requisição e responde
│       ├── services/              # regras de negócio
│       ├── repositories/          # SQL (acesso ao banco)
│       ├── middlewares/           # autenticação, permissões, erros, limites
│       └── utils/                 # validações, datas, helpers
├── frontend/
│   ├── *.html                     # uma página por tela
│   ├── css/                       # base, layout e componentes
│   └── js/
│       ├── core/                  # api, sessão, layout, componentes de UI
│       └── pages/                 # um arquivo JS por página
└── docs/                          # API, arquitetura e checklist da documentação
```

Fluxo de uma requisição: **rota → controller → service → repository → PostgreSQL**.

---

## Perfis e permissões

| Ação | Administrador | Cuidador | Familiar |
|---|:-:|:-:|:-:|
| Gerenciar usuários, perfis e **criar contas** de cuidador/familiar | ✅ | – | – |
| Cadastrar idoso e convidar pessoas (código) | – | ✅ | – |
| Registrar rotina, doses, alimentação, observações | – | ✅ | – |
| Consultar rotina, histórico e registros | – | ✅ | ✅ (somente leitura) |
| Entrar no acompanhamento com um código | – | ✅ | ✅ |

O administrador **não** acessa dados de saúde dos idosos (privacidade / LGPD): para vincular contas ele vê apenas o **nome** dos idosos.

## Principais funcionalidades

- Cadastro com **nome, CPF (validado), e-mail, perfil e senha** (mín. 8), sem e-mail/CPF repetidos; login com senha criptografada (bcrypt) e token JWT
- **Autorização de familiar por e-mail**: se a pessoa já tem conta, o vínculo é imediato; se não tem, fica *pendente* e é ativado quando ela se cadastrar como Familiar com o mesmo e-mail
- **Administrador cria contas** de Cuidador/Familiar e já vincula aos idosos desejados
- **Registro rápido** no dashboard (água, alimentação, higiene, medicação, ocorrência) e alerta fixo de **alergias/observações médicas**
- **Identidade por perfil**: azul profundo + teal; área do **Familiar** com visual próprio e faixa permanente de "modo de visualização · leitura"; **Medicamentos** em verde esmeralda
- Vários idosos por cuidador e **vários cuidadores/familiares por idoso** (código de vínculo)
- Rotina do dia com cuidados, doses de medicamento e consultas em uma só linha do tempo
- Cuidados que se repetem (ex.: todos os dias da semana)
- Medicamentos com **múltiplos horários** e marcação de dose administrada (com quem e quando)
- **Lembretes**: sino com itens atrasados/próximos, aviso na tela e notificação do navegador
- Alimentação, hidratação (total de ml do dia), higiene e atividade física
- Consultas e compromissos, observações por categoria
- Histórico unificado com filtros, paginação, **exportação CSV** e impressão
- Painel do administrador

## Segurança implementada

- Senhas com **bcrypt**; login com limite de tentativas; mensagem única para e-mail/senha errados
- **JWT** com expiração; o usuário é conferido no banco a cada requisição (conta desativada perde acesso na hora)
- Autorização no **servidor** (perfil + vínculo com o idoso); familiar nunca consegue alterar dados
- SQL sempre com parâmetros (sem concatenar texto do usuário)
- Validação de dados (e-mail, CPF com dígito verificador, datas, horários...)
- Cabeçalhos de segurança (`helmet`) e limites de requisições
- Todo texto exibido na tela é escapado (proteção contra XSS)

## De onde vieram as ideias

Esta versão junta o melhor dos dois projetos do grupo:

| Do projeto original (React/tRPC) | Como ficou aqui |
|---|---|
| CPF no cadastro e na criação de contas | Campo obrigatório e validado (dígito verificador), único por usuário |
| Autorização de familiar por e-mail (convite pendente) | Tabela `convites_familiares`; consumida no cadastro do familiar |
| Administrador cadastra cuidadores/familiares e vincula idosos | Tela *Novo usuário* com escolha dos idosos |
| Identidade visual (azul, teal do familiar, verde dos medicamentos) | Paleta e temas aplicados em todas as telas |
| Formulário rápido de cuidados | *Registro rápido* no dashboard |
| Alergias / observações médicas do idoso | Destaque no dashboard |

E o que a versão com Node/Express/PostgreSQL acrescentou: servidor e banco reais (dados sincronizados entre
aparelhos), rotina com horários, doses por medicamento, lembretes, consultas, histórico com CSV, etc.
A stack escolhida (HTML/CSS/JS + Node.js + PostgreSQL) é a mesma descrita no Modelo 5 da documentação.

## Próximos passos sugeridos

- Envio automático do convite por e-mail, confirmação de e-mail e "esqueci minha senha"
- Token em cookie `httpOnly` (mais seguro que `localStorage`)
- Deploy (Render/Railway) com GitHub Actions rodando `npm test`
- Notificações push/WhatsApp para familiares

## Solução de problemas

| Mensagem | O que fazer |
|---|---|
| `Defina JWT_SECRET...` | Crie o arquivo `backend/.env` a partir do `.env.example` |
| `Não foi possível conectar ao PostgreSQL` | No modo integrado, confira usuário/senha/porta no `.env` e se o PostgreSQL está ligado. Para apresentação sem PostgreSQL, siga a seção “Demonstração sem PostgreSQL” e abra `frontend/index.html` pelo Live Server. |
| `Unknown database 'cuidar_mais'` | Rode `npm run db:init` |
| Páginas sem estilo/ícones | Os ícones usam a internet (Font Awesome via CDN) |
| Tela não abre ao clicar duas vezes no HTML | Abra a pasta `frontend` pelo Live Server do VS Code; módulos JavaScript do navegador precisam de um servidor HTTP local. |
