# 🔧 Correção: Problemas de CASCADE no SQL Server

## Problema

SQL Server não permite múltiplos caminhos de CASCADE que podem criar ciclos. O erro ocorreu em `project_template_tasks` porque:

1. `ProjectTemplateTask` tem CASCADE para `ProjectTemplate` (via `template_id`)
2. `ProjectTemplateTask` tem CASCADE para `ProjectTemplatePhase` (via `phase_id`)
3. `ProjectTemplatePhase` tem CASCADE para `ProjectTemplate`

Isso cria múltiplos caminhos de cascade, o que SQL Server não permite.

## Solução Aplicada

Removido o CASCADE do relacionamento `template_id` em `ProjectTemplateTask`, mantendo apenas o CASCADE via `phase_id`. Agora:

- Se deletar `ProjectTemplate` → deleta `ProjectTemplatePhase` (CASCADE)
- Se deletar `ProjectTemplatePhase` → deleta `ProjectTemplateTask` (CASCADE)
- Se deletar `ProjectTemplate` diretamente → tasks são deletadas através das phases

## Se Ainda Houver Erros

Se aparecerem outros erros similares, pode ser necessário ajustar outras relações. O padrão é:
- Remover CASCADE de relações que criam múltiplos caminhos
- Manter CASCADE apenas em um caminho da hierarquia

