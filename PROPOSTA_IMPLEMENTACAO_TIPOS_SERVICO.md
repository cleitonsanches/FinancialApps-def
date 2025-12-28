# Proposta de Implementação - Tipos de Serviço em Negociações

## 📋 Resumo Executivo

Esta proposta detalha a implementação de campos específicos para cada tipo de serviço negociado, incluindo:
- Análise de Dados
- Assinaturas
- Manutenções
- Contrato Fixo
- Desenvolvimentos e Automações (seguindo padrão de Migração)

**Inclui também:**
- ✅ Sistema de Classificação de Honorários vinculado ao Plano de Contas
- ✅ Associação automática de classificação ao criar parcelas (Contas a Receber)
- ✅ Exibição da classificação nos detalhes das parcelas (mantendo padrão visual atual)

## 🗄️ Estrutura de Banco de Dados

### 1. Adicionar Campo de Classificação na Tabela `invoices`

```sql
-- Campo para classificação/tipo de honorário (referência ao Plano de Contas)
ALTER TABLE invoices ADD COLUMN chart_of_accounts_id VARCHAR(36);
CREATE INDEX IX_invoices_chart_of_accounts_id ON invoices(chart_of_accounts_id);
```

### 2. Adicionar Campos na Tabela `proposals`

```sql
-- Campos para Análise de Dados
ALTER TABLE proposals ADD COLUMN data_inicio_analise DATE;
ALTER TABLE proposals ADD COLUMN data_programada_homologacao DATE;
ALTER TABLE proposals ADD COLUMN data_programada_producao DATE;

-- Campos para Assinaturas
ALTER TABLE proposals ADD COLUMN tipo_produto_assinado VARCHAR(100); -- BI Explorer, etc
ALTER TABLE proposals ADD COLUMN quantidade_usuarios INTEGER;
ALTER TABLE proposals ADD COLUMN valor_unitario_usuario DECIMAL(15,2);
ALTER TABLE proposals ADD COLUMN data_inicio_assinatura DATE;
ALTER TABLE proposals ADD COLUMN vencimento_assinatura DATE; -- Calculado: 12 meses após início

-- Campos para Manutenções
ALTER TABLE proposals ADD COLUMN descricao_manutencao TEXT;
ALTER TABLE proposals ADD COLUMN valor_mensal_manutencao DECIMAL(15,2);
ALTER TABLE proposals ADD COLUMN data_inicio_manutencao DATE;
ALTER TABLE proposals ADD COLUMN vencimento_manutencao DATE; -- Calculado: 12 meses após início

-- Campos para Contrato Fixo
ALTER TABLE proposals ADD COLUMN valor_mensal_fixo DECIMAL(15,2);
ALTER TABLE proposals ADD COLUMN data_fim_contrato DATE; -- Calculado: 12 meses após início

-- Campo genérico para indicar se tem manutenção vinculada
ALTER TABLE proposals ADD COLUMN tem_manutencao_vinculada BOOLEAN DEFAULT FALSE;
ALTER TABLE proposals ADD COLUMN proposta_manutencao_id VARCHAR(36); -- FK para proposta de manutenção vinculada
```

### 3. Criar Tabela para Histórico de Aditivos

```sql
CREATE TABLE proposal_aditivos (
  id VARCHAR(36) PRIMARY KEY,
  proposal_id VARCHAR(36) NOT NULL,
  data_aditivo DATE NOT NULL,
  percentual_reajuste DECIMAL(5,2) NOT NULL,
  valor_anterior DECIMAL(15,2) NOT NULL,
  valor_novo DECIMAL(15,2) NOT NULL,
  ano_referencia INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id)
);

CREATE INDEX IX_proposal_aditivos_proposal_id ON proposal_aditivos(proposal_id);
```

### 4. Criar Tabela para Produtos de Assinatura

```sql
CREATE TABLE subscription_products (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, code)
);
```

## 🏗️ Arquitetura da Solução

### Estrutura de Entidades (Backend)

#### 1. Atualizar `Invoice` Entity

```typescript
// apps/api/src/database/entities/invoice.entity.ts

// Adicionar campo de classificação:
@Column({ name: 'chart_of_accounts_id', type: 'varchar', length: 36, nullable: true })
chartOfAccountsId?: string;

@ManyToOne(() => ChartOfAccounts, { nullable: true })
@JoinColumn({ name: 'chart_of_accounts_id' })
chartOfAccounts?: ChartOfAccounts;
```

#### 2. Atualizar `Proposal` Entity

```typescript
// apps/api/src/database/entities/proposal.entity.ts

// Adicionar campos:
@Column({ name: 'data_inicio_analise', type: 'date', nullable: true })
dataInicioAnalise?: Date;

@Column({ name: 'data_programada_homologacao', type: 'date', nullable: true })
dataProgramadaHomologacao?: Date;

@Column({ name: 'data_programada_producao', type: 'date', nullable: true })
dataProgramadaProducao?: Date;

@Column({ name: 'tipo_produto_assinado', type: 'varchar', length: 100, nullable: true })
tipoProdutoAssinado?: string;

@Column({ name: 'quantidade_usuarios', type: 'integer', nullable: true })
quantidadeUsuarios?: number;

@Column({ name: 'valor_unitario_usuario', type: 'decimal', precision: 15, scale: 2, nullable: true })
valorUnitarioUsuario?: number;

@Column({ name: 'data_inicio_assinatura', type: 'date', nullable: true })
dataInicioAssinatura?: Date;

@Column({ name: 'vencimento_assinatura', type: 'date', nullable: true })
vencimentoAssinatura?: Date;

@Column({ name: 'descricao_manutencao', type: 'text', nullable: true })
descricaoManutencao?: string;

@Column({ name: 'valor_mensal_manutencao', type: 'decimal', precision: 15, scale: 2, nullable: true })
valorMensalManutencao?: number;

@Column({ name: 'data_inicio_manutencao', type: 'date', nullable: true })
dataInicioManutencao?: Date;

@Column({ name: 'vencimento_manutencao', type: 'date', nullable: true })
vencimentoManutencao?: Date;

@Column({ name: 'valor_mensal_fixo', type: 'decimal', precision: 15, scale: 2, nullable: true })
valorMensalFixo?: number;

@Column({ name: 'data_fim_contrato', type: 'date', nullable: true })
dataFimContrato?: Date;

@Column({ name: 'tem_manutencao_vinculada', type: 'boolean', default: false })
temManutencaoVinculada?: boolean;

@Column({ name: 'proposta_manutencao_id', type: 'varchar', length: 36, nullable: true })
propostaManutencaoId?: string;

@OneToMany(() => ProposalAditivo, aditivo => aditivo.proposal)
aditivos?: ProposalAditivo[];
```

#### 3. Criar Entity `ProposalAditivo`

```typescript
// apps/api/src/database/entities/proposal-aditivo.entity.ts

@Entity('proposal_aditivos')
export class ProposalAditivo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'proposal_id' })
  proposalId: string;

  @ManyToOne(() => Proposal, proposal => proposal.aditivos)
  @JoinColumn({ name: 'proposal_id' })
  proposal: Proposal;

  @Column({ name: 'data_aditivo', type: 'date' })
  dataAditivo: Date;

  @Column({ name: 'percentual_reajuste', type: 'decimal', precision: 5, scale: 2 })
  percentualReajuste: number;

  @Column({ name: 'valor_anterior', type: 'decimal', precision: 15, scale: 2 })
  valorAnterior: number;

  @Column({ name: 'valor_novo', type: 'decimal', precision: 15, scale: 2 })
  valorNovo: number;

  @Column({ name: 'ano_referencia', type: 'integer' })
  anoReferencia: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

#### 4. Criar Entity `SubscriptionProduct`

```typescript
// apps/api/src/database/entities/subscription-product.entity.ts

@Entity('subscription_products')
@Index('IX_subscription_products_company_code', ['companyId', 'code'], { unique: true })
export class SubscriptionProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'code', type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

## 🎨 Interface do Usuário (Frontend)

### Exibição de Classificação de Honorários

**No Modal de Detalhes das Parcelas (Contas a Receber):**

- Adicionar campo "Classificação" ou "Tipo de Honorário" na seção "Informações Principais"
- Exibir o nome da conta do Plano de Contas (ex: "Honorários - Análise de Dados")
- Manter o mesmo padrão visual das outras informações (sem destaque especial)
- Campo não editável (apenas visualização)

**Exemplo de estrutura no modal (mantendo padrão visual atual):**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700">Origem</label>
    <p className="mt-1 text-sm text-gray-900">Negociação - 2/2025</p>
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700">Cliente</label>
    <p className="mt-1 text-sm text-gray-900">RICARDO PASSOS</p>
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-700">Classificação</label>
    <p className="mt-1 text-sm text-gray-900">
      {invoice.chartOfAccounts?.name || '-'}
    </p>
  </div>
  {/* ... outros campos ... */}
</div>
```

**Observações:**
- Campo exibido no mesmo padrão dos demais (sem destaque especial)
- Usar `invoice.chartOfAccounts?.name` para exibir o nome da classificação
- Se não houver classificação, exibir "-"
- Manter mesmo estilo visual (text-sm text-gray-900)

### Estrutura de Campos por Tipo de Serviço

#### 1. Análise de Dados
- Data de início
- Data programada para homologação
- Data programada para produção

#### 2. Assinaturas
- Tipo de produto (dropdown com produtos cadastrados)
- Quantidade de usuários
- Valor unitário por usuário
- Valor total mensal (calculado: quantidade × valor unitário)
- Data de início da assinatura
- Vencimento (calculado automaticamente: 12 meses após início, editável)

#### 3. Manutenções
- Descrição da manutenção (textarea)
- Valor mensal (= Valor da Proposta)
- Data de início
- Vencimento (calculado: 12 meses após início, editável)

#### 4. Contrato Fixo
- Valor mensal fixo (= Valor da Proposta)
- Data de início
- Data de fim (calculado: 12 meses após início, editável)

#### 5. Desenvolvimentos e Automações
- Seguir mesmo padrão de Migração de Dados (já implementado)

## 🏷️ Sistema de Classificação de Honorários

### Mapeamento de Tipos de Serviço para Classificação

Cada tipo de serviço terá uma classificação automática no formato:
- "Honorários - Análise de Dados"
- "Honorários - Assinaturas"
- "Honorários - Automações"
- "Honorários - Consultoria"
- "Honorários - Desenvolvimentos"
- "Honorários - Manutenções"
- "Honorários - Migração de Dados"
- "Honorários - Treinamento"

### Função de Busca/Criação Automática

```typescript
async function obterOuCriarClassificacaoHonorarios(
  serviceType: string,
  companyId: string
): Promise<ChartOfAccounts> {
  const nomeClassificacao = `Honorários - ${serviceType}`;
  
  // Buscar se já existe
  let classificacao = await this.chartOfAccountsRepository.findOne({
    where: {
      companyId,
      name: nomeClassificacao,
      type: 'RECEITA'
    }
  });
  
  // Se não existe, criar
  if (!classificacao) {
    classificacao = await this.chartOfAccountsRepository.create({
      companyId,
      name: nomeClassificacao,
      type: 'RECEITA',
      status: 'ATIVA',
      code: `HON-${serviceType.toUpperCase().substring(0, 3)}`
    });
    classificacao = await this.chartOfAccountsRepository.save(classificacao);
  }
  
  return classificacao;
}
```

### Aplicação na Criação de Parcelas

Ao criar parcelas ao fechar negociação:
1. Identificar o `serviceType` da proposta
2. Buscar ou criar a classificação correspondente
3. Associar `chartOfAccountsId` em cada invoice criada

## 🔄 Fluxos de Trabalho

### 1. Criação de Negociação

1. Usuário seleciona tipo de serviço
2. Sistema exibe campos específicos do tipo selecionado
3. Campos são salvos na tabela `proposals`
4. Se tipo for Assinatura/Manutenção/Contrato Fixo:
   - Calcular vencimento automaticamente (12 meses)
   - Permitir edição manual

### 2. Criação de Parcelas (Contas a Receber)

Ao fechar negociação e criar parcelas:

1. Identificar tipo de serviço da proposta
2. Buscar ou criar classificação "Honorários - [Tipo de Serviço]" no Plano de Contas
3. Criar invoices com `chartOfAccountsId` preenchido
4. Exibir classificação nos detalhes da parcela

### 3. Fechamento de Negociação

#### Para Assinaturas, Manutenções e Contrato Fixo:

1. Após confirmar parcelas, exibir seção de Aditivos
2. Campos disponíveis:
   - Checkbox: "Aditivar"
   - Campo: Percentual de reajuste
3. Ao salvar aditivo:
   - Calcular valor novo = valor anterior × (1 + percentual/100)
   - Criar registro em `proposal_aditivos`
   - Atualizar valor das parcelas futuras
   - Manter histórico de valores

#### Para Desenvolvimentos, Automações e Análise de Dados:

1. Após confirmar parcelas, exibir diálogo:
   "Deseja acrescentar contratação de manutenção?"
2. Se SIM:
   - Criar nova proposta de Manutenção vinculada
   - Preencher automaticamente:
     - Cliente (mesmo da proposta principal)
     - Valor mensal (sugerir baseado no valor da proposta)
     - Data de início (sugerir após previsão de conclusão)
   - Permitir ajustes
   - Salvar com `tem_manutencao_vinculada = true` na proposta principal

### 4. Visualização de Detalhes

- Exibir campos específicos do tipo de serviço
- Exibir classificação de honorários (nome da conta do Plano de Contas)
- Se houver aditivos, exibir:
  - Tabela com histórico de aditivos
  - Data do aditivo
  - Percentual aplicado
  - Valor anterior → Valor novo
  - Ano de referência

## 📝 Implementação Sugerida - Ordem de Execução

### Fase 1: Estrutura de Banco de Dados
1. ✅ Criar migration para adicionar campo `chart_of_accounts_id` na tabela `invoices`
2. ✅ Criar migration para adicionar campos na tabela `proposals`
3. ✅ Criar tabela `proposal_aditivos`
4. ✅ Criar tabela `subscription_products`
5. ✅ Criar entidades no backend
6. ✅ Implementar função de busca/criação automática de classificações

### Fase 2: Backend - Serviços e Controllers
1. ✅ Atualizar `InvoicesService` para incluir classificação ao criar parcelas
2. ✅ Criar função `obterOuCriarClassificacaoHonorarios` no `InvoicesService`
3. ✅ Criar `SubscriptionProductsService` e `SubscriptionProductsController`
4. ✅ Criar `ProposalAditivosService` e métodos no `ProposalsService`
5. ✅ Adicionar lógica de cálculo de vencimento (12 meses)
6. ✅ Adicionar lógica de criação de proposta de manutenção vinculada

### Fase 3: Frontend - Formulários
1. ✅ Criar componentes de campos específicos por tipo de serviço
2. ✅ Implementar lógica condicional de exibição
3. ✅ Adicionar cálculos automáticos (vencimento, valor total)
4. ✅ Integrar com templates de proposta
5. ✅ Exibir classificação de honorários no modal de detalhes das parcelas (sem alterar visual)

### Fase 4: Frontend - Fechamento e Aditivos
1. ✅ Criar modal/seção de aditivos
2. ✅ Implementar criação de proposta de manutenção vinculada
3. ✅ Exibir histórico de aditivos nos detalhes
4. ✅ Atualizar parcelas após aditivo

### Fase 5: Templates
1. ✅ Adicionar novos campos aos templates de proposta
2. ✅ Permitir seleção de campos por tipo de serviço

## 🔧 Detalhes Técnicos

### Cálculo de Vencimento (12 meses)

```typescript
function calcularVencimento(dataInicio: Date): Date {
  const vencimento = new Date(dataInicio);
  vencimento.setMonth(vencimento.getMonth() + 12);
  return vencimento;
}
```

### Cálculo de Valor com Aditivo

```typescript
function calcularValorComAditivo(valorAnterior: number, percentual: number): number {
  return valorAnterior * (1 + percentual / 100);
}
```

### Criação de Proposta de Manutenção Vinculada

```typescript
async criarPropostaManutencaoVinculada(propostaPrincipal: Proposal) {
  const propostaManutencao = {
    companyId: propostaPrincipal.companyId,
    clientId: propostaPrincipal.clientId,
    serviceType: 'MANUTENCOES',
    status: 'RASCUNHO',
    valorMensalManutencao: calcularValorSugerido(propostaPrincipal),
    dataInicioManutencao: calcularDataInicioSugerida(propostaPrincipal),
    vencimentoManutencao: calcularVencimento(dataInicioManutencao),
    // ... outros campos
  };
  
  const criada = await this.proposalsService.create(propostaManutencao);
  
  // Atualizar proposta principal
  await this.proposalsService.update(propostaPrincipal.id, {
    temManutencaoVinculada: true,
    propostaManutencaoId: criada.id
  });
  
  return criada;
}
```

### Criação de Parcelas com Classificação

```typescript
async createFromProposalParcels(proposalId: string, parcels: any[], companyId: string) {
  // Buscar proposta para obter serviceType
  const proposal = await this.proposalRepository.findOne({ where: { id: proposalId } });
  
  // Obter ou criar classificação de honorários
  const classificacao = await this.obterOuCriarClassificacaoHonorarios(
    proposal.serviceType,
    companyId
  );
  
  const invoicesToCreate = parcels.map(parcel => {
    return this.invoiceRepository.create({
      companyId,
      clientId: parcel.clientId,
      proposalId,
      chartOfAccountsId: classificacao.id, // ✅ Associar classificação
      invoiceNumber: `NEG-${proposalId.substring(0, 4)}-${String(parcel.numero).padStart(3, '0')}`,
      emissionDate: parseDate(parcel.dataFaturamento),
      dueDate: parseDate(parcel.dataVencimento),
      grossValue: parcel.valor,
      status: 'PROVISIONADA',
      origem: 'NEGOCIACAO',
    });
  });
  
  return await this.invoiceRepository.save(invoicesToCreate);
}
```

## 📊 Exemplo de Estrutura de Dados

### Invoice com Classificação
```json
{
  "id": "uuid",
  "invoiceNumber": "NEG-0002-001",
  "chartOfAccountsId": "uuid-da-classificacao",
  "chartOfAccounts": {
    "id": "uuid-da-classificacao",
    "name": "Honorários - Assinaturas",
    "type": "RECEITA",
    "code": "HON-ASS"
  },
  "grossValue": 1500.00,
  "status": "PROVISIONADA"
}
```

### Proposta de Assinatura
```json
{
  "serviceType": "ASSINATURAS",
  "tipoProdutoAssinado": "BI_EXPLORER",
  "quantidadeUsuarios": 10,
  "valorUnitarioUsuario": 150.00,
  "valorProposta": 1500.00,
  "dataInicioAssinatura": "2026-01-01",
  "vencimentoAssinatura": "2027-01-01",
  "formaFaturamento": "MENSAL"
}
```

### Aditivo
```json
{
  "proposalId": "uuid-da-proposta",
  "dataAditivo": "2027-01-01",
  "percentualReajuste": 5.5,
  "valorAnterior": 1500.00,
  "valorNovo": 1582.50,
  "anoReferencia": 2027
}
```

## ✅ Checklist de Implementação

- [ ] Adicionar campo `chart_of_accounts_id` na tabela `invoices`
- [ ] Criar migrations de banco de dados para novos campos
- [ ] Criar entidades no backend
- [ ] Implementar função de busca/criação automática de classificações
- [ ] Atualizar `InvoicesService` para associar classificação ao criar parcelas
- [ ] Criar serviços e controllers
- [ ] Implementar lógica de cálculos
- [ ] Criar componentes de formulário no frontend
- [ ] Implementar lógica condicional de exibição
- [ ] Exibir classificação no modal de detalhes das parcelas (mantendo padrão visual)
- [ ] Criar modal de aditivos
- [ ] Implementar criação de manutenção vinculada
- [ ] Adicionar campos aos templates
- [ ] Testes de integração
- [ ] Documentação

## 🎯 Próximos Passos

1. Revisar e aprovar esta proposta
2. Iniciar Fase 1 (Estrutura de Banco de Dados)
3. Implementar em ordem sequencial
4. Testar cada fase antes de avançar

