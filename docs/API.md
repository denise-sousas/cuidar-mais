# API REST do Cuidar+

Base: `/api/v1` · Formato: JSON · Autenticação: `Authorization: Bearer <token>` (exceto registro e login).

Erros: `{ "erro": { "mensagem": "...", "detalhes": { "campo": "mensagem" } } }`

Códigos: `200` ok · `201` criado · `204` sem conteúdo · `400` dados inválidos · `401` não autenticado ·
`403` sem permissão · `404` não encontrado · `409` conflito (duplicado) · `429` muitas tentativas · `500` erro interno.

Legenda de acesso: **C** = cuidador · **F** = familiar (vinculado ao idoso) · **A** = administrador.
Em `/idosos/:idosoId/...` o usuário precisa estar vinculado ao idoso; alterações exigem **C**.

## Autenticação
| Método | Endpoint | Descrição | Acesso |
|---|---|---|---|
| POST | `/auth/registro` | Cria conta (`nome`, `cpf`, `email`, `senha`, `perfil`: cuidador/familiar), ativa autorizações pendentes do e-mail e devolve token (`vinculosAtivados`) | Pública |
| POST | `/auth/login` | Login (`email`, `senha`) e devolve token | Pública |
| GET | `/auth/me` | Dados do usuário logado | Logado |

## Idosos e vínculos
| Método | Endpoint | Descrição | Acesso |
|---|---|---|---|
| GET | `/idosos` | Idosos que o usuário acompanha | C, F |
| POST | `/idosos` | Cadastra idoso (gera código de vínculo) | C |
| POST | `/idosos/vincular` | Entra no acompanhamento (`codigo`) | C, F |
| GET | `/idosos/:idosoId` | Dados do idoso | C, F |
| PUT | `/idosos/:idosoId` | Atualiza dados | C |
| DELETE | `/idosos/:idosoId` | Exclui (somente quem cadastrou) | C |
| POST | `/idosos/:idosoId/codigo` | Gera novo código de vínculo | C |
| GET | `/idosos/:idosoId/vinculos` | Pessoas vinculadas | C |
| DELETE | `/idosos/:idosoId/vinculos/:usuarioId` | Remove pessoa (ou sai, se for você) | C / próprio |
| GET | `/idosos/:idosoId/convites` | Autorizações de familiar pendentes (por e-mail) | C |
| POST | `/idosos/:idosoId/convites` | Autoriza familiar por e-mail (`email`): vincula na hora ou deixa pendente | C |
| DELETE | `/idosos/:idosoId/convites/:id` | Cancela autorização pendente | C |

## Visões de leitura
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/idosos/:idosoId/resumo` | Dashboard do dia |
| GET | `/idosos/:idosoId/rotina?data=AAAA-MM-DD` | Cuidados + doses + consultas do dia |
| GET | `/idosos/:idosoId/lembretes?antecedencia=30` | Itens atrasados ou próximos |
| GET | `/idosos/:idosoId/historico?de&ate&tipo&pagina&tamanho` | Histórico unificado |

## Recursos do idoso
| Recurso | Endpoints (prefixo `/idosos/:idosoId`) |
|---|---|
| Medicamentos | `GET /medicamentos` · `GET /medicamentos/:id` · `POST /medicamentos` · `PUT /medicamentos/:id` · `DELETE /medicamentos/:id` |
| Doses | `GET /medicamentos/agenda?data` · `POST /medicamentos/doses` (`medicamentoId`, `horario`, `data?`) · `DELETE /medicamentos/doses?medicamentoId&horario&data` |
| Cuidados (rotina) | `GET /cuidados?data` · `POST /cuidados` (`repetirDias?`) · `PUT /cuidados/:id` · `PATCH /cuidados/:id/concluir` · `DELETE /cuidados/:id` |
| Registros | `GET /registros?data&tipo` · `GET /registros/resumo?data` · `POST` · `PUT /:id` · `DELETE /:id` |
| Consultas | `GET /consultas?situacao` · `POST` · `PUT /:id` · `PATCH /:id/realizada` · `DELETE /:id` |
| Observações | `GET /observacoes?categoria` · `POST` · `PUT /:id` · `DELETE /:id` |

## Administração (A)
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/admin/usuarios?busca` | Lista usuários |
| POST | `/admin/usuarios` | Cria conta de cuidador/familiar (`nome`, `cpf`, `email`, `senha`, `perfil`, `idosoIds?`) |
| PATCH | `/admin/usuarios/:id` | Altera `perfil` e/ou `ativo` |
| GET | `/admin/idosos` | Lista id e nome dos idosos (para vincular contas) |
| GET | `/admin/estatisticas` | Totais do sistema |

## Exemplo
```http
POST /api/v1/idosos/1/medicamentos
Authorization: Bearer <token>

{ "nome": "Losartana", "dosagem": "50 mg", "via": "Oral", "horarios": ["08:00", "20:00"] }
```
