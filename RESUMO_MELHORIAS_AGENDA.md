# 📋 Resumo: Melhorias na Agenda/Atividades

Este é um trabalho grande que envolve várias mudanças. Vou implementar em etapas.

## Problemas Urgentes (Corrigir Primeiro)

1. ✅ **Adicionar função `loadNegotiations()`** - Negociações não aparecem no dropdown
2. ✅ **Exibir todos os vínculos** - Mostrar Projeto, Negociação E Cliente na lista

## Funcionalidades Novas (Implementar Depois)

3. **Sistema de Abas** (substituir filtro de status)
   - Todas, Pendentes, Em Progresso, Bloqueadas, Concluídas, Canceladas
   
4. **Ordenação**
   - Botão de ordenação (Data, Cliente, Projeto, Status)
   - Padrão: ordem decrescente de data

5. **Tarja "Atrasada"**
   - Mostrar para atividades PENDENTES com dataConclusao < hoje

6. **Calendário fixo em "DIA"**
   - Mudar inicialização de 'month' para 'day'

## Decisão

O arquivo `agenda/page.tsx` tem mais de 2100 linhas. É viável fazer todas as mudanças de uma vez ou prefere que eu faça em etapas?

Sugestão: Começar pelas correções urgentes (#1 e #2), depois implementar as abas e ordenação.

