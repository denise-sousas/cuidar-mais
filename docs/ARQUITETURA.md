# Arquitetura do Cuidar+

## Camadas do backend

```
Requisição HTTP
   │
   ▼
 routes        mapeia URL -> controller e aplica middlewares (login, perfil, vínculo)
   ▼
 controllers   lê req, chama o service e devolve a resposta (sem regra de negócio)
   ▼
 services      regras de negócio e validação de dados
   ▼
 repositories  SQL parametrizado (único lugar que fala com o PostgreSQL)
   ▼
 PostgreSQL
```

Cada camada só conhece a de baixo. Trocar o banco, por exemplo, mexe apenas em `repositories/` e `config/`.

## Modelo de dados (DER)

```mermaid
erDiagram
  usuarios ||--o{ vinculos : possui
  idosos   ||--o{ vinculos : tem
  idosos   ||--o{ medicamentos : toma
  medicamentos ||--o{ horarios_medicamento : "tem horários"
  medicamentos ||--o{ administracoes_medicamento : "doses dadas"
  idosos   ||--o{ cuidados : "rotina"
  idosos   ||--o{ registros_cuidado : "alimentação/água/higiene"
  idosos   ||--o{ consultas : agenda
  idosos   ||--o{ observacoes : ocorrências
  usuarios ||--o{ idosos : "cadastra (criado_por)"
  idosos   ||--o{ convites_familiares : "autorizações por e-mail"

  usuarios { int id PK
    string nome
    string email UK
    string cpf UK
    string senha_hash
    enum perfil
    bool ativo }
  idosos { int id PK
    string nome
    date data_nascimento
    string cpf UK
    string codigo_vinculo UK
    int criado_por FK }
  convites_familiares { int id PK
    int idoso_id FK
    string email
    int criado_por FK }
  vinculos { int id PK
    int usuario_id FK
    int idoso_id FK
    enum papel }
  medicamentos { int id PK
    int idoso_id FK
    string nome
    string dosagem
    bool ativo }
  horarios_medicamento { int id PK
    int medicamento_id FK
    time horario }
  administracoes_medicamento { int id PK
    int medicamento_id FK
    time horario
    date data
    datetime administrado_em
    int usuario_id FK }
  cuidados { int id PK
    int idoso_id FK
    string titulo
    enum tipo
    date data
    time horario
    bool concluido }
  registros_cuidado { int id PK
    int idoso_id FK
    enum tipo
    int quantidade_ml
    datetime data_hora }
  consultas { int id PK
    int idoso_id FK
    string titulo
    date data
    time horario
    bool realizada }
  observacoes { int id PK
    int idoso_id FK
    enum categoria
    text texto
    datetime data_hora }
```

## Decisões de projeto

| Decisão | Motivo |
|---|---|
| Tabela `vinculos` (N:N) | Um cuidador acompanha vários idosos e um idoso tem vários cuidadores/familiares |
| Código de vínculo (`CUIDAR-XXXXXX`) | Implementa a regra "familiar só acompanha se autorizado" sem depender de e-mail |
| `convites_familiares` | Permite autorizar um familiar pelo e-mail antes de ele ter conta; o convite vira vínculo no cadastro |
| Papel no vínculo (cuidador/familiar) | Familiar é somente leitura; a checagem é feita no servidor |
| Doses guardam o horário (não FK) | O histórico continua correto mesmo se os horários do medicamento mudarem |
| `ON DELETE CASCADE` nos registros do idoso | Excluir o idoso apaga tudo ligado a ele (direito de exclusão - LGPD) |
| Histórico por `UNION ALL` | Uma linha do tempo única, sem duplicar dados em outra tabela |
| Datas como texto (`dateStrings`/timestamp sem fuso) | Evita erros de fuso horário entre servidor, banco e navegador |
| Backend serve o frontend | Um comando (`npm start`) roda tudo; sem problemas de CORS |
