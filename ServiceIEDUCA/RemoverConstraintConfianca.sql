-- Script para remover a constraint CK_RedacaoCorrecoes_ConfiancaAvaliacao
USE [ServiceIEDUCA]
GO

-- Verificar se a constraint existe e remover
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_RedacaoCorrecoes_ConfiancaAvaliacao')
BEGIN
    ALTER TABLE [dbo].[RedacaoCorrecoes] DROP CONSTRAINT [CK_RedacaoCorrecoes_ConfiancaAvaliacao]
    PRINT 'Constraint CK_RedacaoCorrecoes_ConfiancaAvaliacao removida com sucesso!'
END
ELSE
BEGIN
    PRINT 'Constraint CK_RedacaoCorrecoes_ConfiancaAvaliacao não existe'
END
GO
