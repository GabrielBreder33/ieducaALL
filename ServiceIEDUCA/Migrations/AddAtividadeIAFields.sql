-- Script para adicionar campos de metadados de Atividades IA
-- Executar este script no SQL Server Management Studio (SSMS)

USE [ServiceIeduca];
GO

-- Verifica se as colunas já existem antes de adicionar
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Materia')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes]
    ADD [Materia] NVARCHAR(100) NULL;
    PRINT 'Coluna Materia adicionada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Coluna Materia já existe.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Segmento')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes]
    ADD [Segmento] NVARCHAR(50) NULL;
    PRINT 'Coluna Segmento adicionada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Coluna Segmento já existe.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Ano')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes]
    ADD [Ano] NVARCHAR(50) NULL;
    PRINT 'Coluna Ano adicionada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Coluna Ano já existe.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Conteudo')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes]
    ADD [Conteudo] NVARCHAR(500) NULL;
    PRINT 'Coluna Conteudo adicionada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Coluna Conteudo já existe.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Nivel')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes]
    ADD [Nivel] NVARCHAR(50) NULL;
    PRINT 'Coluna Nivel adicionada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Coluna Nivel já existe.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Tipo')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes]
    ADD [Tipo] NVARCHAR(50) NULL;
    PRINT 'Coluna Tipo adicionada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Coluna Tipo já existe.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'GeradaPorIA')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes]
    ADD [GeradaPorIA] BIT NOT NULL DEFAULT 0;
    PRINT 'Coluna GeradaPorIA adicionada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Coluna GeradaPorIA já existe.';
END
GO

-- Verificar estrutura final
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'AtividadeExecucoes'
ORDER BY ORDINAL_POSITION;
GO

PRINT 'Script executado com sucesso!';
GO
