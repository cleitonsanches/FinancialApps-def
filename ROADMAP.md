# Roadmap - FinancialApps

## Melhorias de UX/UI

### Responsividade Mobile
- [ ] **Menu Hambúrguer para Mobile** (Prioridade: Alta)
  - Implementar menu hambúrguer no componente `NavigationLinks.tsx`
  - Em telas < 768px: ocultar links e mostrar botão ☰
  - Menu lateral ou dropdown com todos os links ao clicar
  - Garantir boa experiência em dispositivos móveis

## Melhorias de Funcionalidades

### Dados de Referência
- [x] Verificar scripts de seed existentes (concluído)
- [x] Documentar dados que precisam ser migrados (ver `DADOS_REFERENCIA.md`)
- [x] Corrigir script `create-service-types.ts` para usar caminho correto do banco
- [ ] Executar `npm run migrate:service-types` na VPS
- [ ] Decidir: exportar/importar dados do banco local OU criar scripts de seed adicionais

## Outros
- Tarefas adicionais serão adicionadas aqui conforme necessário

