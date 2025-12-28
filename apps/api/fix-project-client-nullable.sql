-- Script SQL para tornar a coluna client_id nullable na tabela projects
-- Execute este script no banco de dados SQLite se o erro persistir

BEGIN TRANSACTION;

-- Criar tabela temporária com client_id nullable
CREATE TABLE projects_temp (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  client_id TEXT,  -- Agora nullable
  proposal_id TEXT,
  template_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT,
  data_inicio TEXT,
  data_fim TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Copiar dados da tabela antiga
INSERT INTO projects_temp 
SELECT 
  id,
  company_id,
  client_id,
  proposal_id,
  template_id,
  name,
  description,
  service_type,
  data_inicio,
  data_fim,
  status,
  created_at,
  updated_at
FROM projects;

-- Remover tabela antiga
DROP TABLE projects;

-- Renomear tabela temporária
ALTER TABLE projects_temp RENAME TO projects;

-- Recriar índices
CREATE INDEX IF NOT EXISTS IX_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS IX_projects_proposal_id ON projects(proposal_id);

COMMIT;

