-- Adicionar colunas para atividades IA
USE [ServiceIEDUCA];

-- Materia
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Materia')
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [Materia] NVARCHAR(100) NULL;

-- Segmento
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Segmento')
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [Segmento] NVARCHAR(50) NULL;

-- Ano
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Ano')
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [Ano] NVARCHAR(50) NULL;

-- Conteudo
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Conteudo')
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [Conteudo] NVARCHAR(500) NULL;

-- Nivel
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Nivel')
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [Nivel] NVARCHAR(50) NULL;

-- Tipo
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Tipo')
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [Tipo] NVARCHAR(50) NULL;

-- GeradaPorIA
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'GeradaPorIA')
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [GeradaPorIA] BIT NOT NULL DEFAULT 0;

-- Verificar resultado
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'AtividadeExecucoes'
  AND COLUMN_NAME IN ('Materia', 'Segmento', 'Ano', 'Conteudo', 'Nivel', 'Tipo', 'GeradaPorIA')
ORDER BY COLUMN_NAME;
