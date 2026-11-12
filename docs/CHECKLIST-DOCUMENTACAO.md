# O que atualizar no PDF de documentação

O sistema agora cumpre o que o documento promete. Para o PDF refletir o projeto (e responder à
crítica de "superficial"), atualize estes pontos:

## Novidades desta versão para documentar
- [ ] CPF obrigatório no cadastro de usuários (RN: e-mail e CPF únicos)
- [ ] Autorização de familiar por e-mail com convite pendente (nova RN3 detalhada) e tabela `convites_familiares`
- [ ] Administrador cria contas de Cuidador/Familiar e vincula idosos (nova US)
- [ ] Registro rápido e alerta de alergias/observações médicas (nova US)
- [ ] Identidade visual por perfil (Familiar em teal, Medicamentos em verde) e faixa "modo de visualização · leitura" (RNF de usabilidade)

## Modelo 1 - Visão
- [ ] Informar o **Administrador** como perfil que existe de fato (gerencia usuários/perfis; não vê dados de saúde)
- [ ] Citar o vínculo por **código** como mecanismo de autorização familiar

## Modelo 2 - Requisitos e Backlog
- [ ] Criar **RF01...RFn** (requisitos funcionais) e uma matriz RF x US x Caso de Uso x Tabela
- [ ] Remover a duplicidade US04/US07 (Acompanhamento Familiar)
- [ ] Novas histórias: login/logout, vínculo por código, lembretes, consultas, administrador, exportar histórico
- [ ] Critérios de aceite no formato **Dado / Quando / Então**
- [ ] RN novas: familiar somente leitura; mínimo de 1 cuidador por idoso; dose registrada não pode ser de dia futuro; administrador não acessa dados do idoso

## Modelo 3 - Casos de uso
- [ ] Corrigir `include`/`extend` e o texto "aluno" -> "idoso"
- [ ] Remover o "Consultar medicamento" duplicado e o Familiar cadastrando idoso
- [ ] Acrescentar fluxo principal, fluxos alternativos e exceções

## Modelo 4 - Classes
- [ ] Adicionar relacionamentos e cardinalidades (ver DER em `docs/ARQUITETURA.md`)
- [ ] Diagrama técnico: trocar Java/Spring por **Node.js/Express** (Controller -> Service -> Repository, como no código)

## Modelo 5 - Arquitetura e dados
- [ ] Stack real: HTML/CSS/JS puro (módulos ES), Node.js + Express, PostgreSQL (pg, administrado pelo pgAdmin), JWT, bcrypt, helmet
- [ ] Dicionário de dados completo (ver `backend/database/schema.sql`: 11 tabelas, `usuarios.cpf` incluído)
- [ ] Endpoints reais e códigos HTTP (ver `docs/API.md`); cadastro é `POST /api/v1/auth/registro`
- [ ] Incluir seção de **segurança e LGPD** (dados de saúde = dados sensíveis)

## Modelos 6, 7 e 8
- [ ] GitFlow: seguir de fato (`feature/USxx-nome`) e mostrar o histórico de commits
- [ ] Manual do usuário com **prints reais** e URL real de deploy
- [ ] Preencher o Termo de Homologação com o cliente/stakeholder real

## Extras que valorizam o trabalho
- [ ] Plano de testes (casos de teste manuais por história) + os testes automatizados do `npm test`
- [ ] Protótipos/prints das telas, riscos, premissas, glossário e cronograma
