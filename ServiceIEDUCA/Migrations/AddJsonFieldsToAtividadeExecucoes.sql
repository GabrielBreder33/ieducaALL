-- Adicionar campos JSON para armazenar questões, gabaritos e respostas
-- Executar este script no banco de dados

USE [iEduca];
GO

-- Verificar se as colunas já existem antes de adicionar
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'QuestoesJson')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes]
    ADD [QuestoesJson] NVARCHAR(MAX) NULL;
    PRINT 'Coluna QuestoesJson adicionada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Coluna QuestoesJson já existe.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'GabaritoJson')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes]
    ADD [GabaritoJson] NVARCHAR(MAX) NULL;
    PRINT 'Coluna GabaritoJson adicionada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Coluna GabaritoJson já existe.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'RespostasJson')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes]
    ADD [RespostasJson] NVARCHAR(MAX) NULL;
    PRINT 'Coluna RespostasJson adicionada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Coluna RespostasJson já existe.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'AtualizadoEm')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes]
    ADD [AtualizadoEm] DATETIME2 NOT NULL DEFAULT GETDATE();
    PRINT 'Coluna AtualizadoEm adicionada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Coluna AtualizadoEm já existe.';
END
GO

PRINT 'Migração concluída!';
GO
