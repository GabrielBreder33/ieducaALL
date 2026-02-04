-- Script para remover todas as constraints problemáticas
USE [ServiceIEDUCA]
GO

-- Remover constraint de ConfiancaAvaliacao
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_RedacaoCorrecoes_ConfiancaAvaliacao')
BEGIN
    ALTER TABLE [dbo].[RedacaoCorrecoes] DROP CONSTRAINT [CK_RedacaoCorrecoes_ConfiancaAvaliacao]
    PRINT 'Constraint CK_RedacaoCorrecoes_ConfiancaAvaliacao removida!'
END
ELSE
BEGIN
    PRINT 'Constraint CK_RedacaoCorrecoes_ConfiancaAvaliacao não existe'
END
GO

-- Remover constraint de Severidade
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_RedacaoErrosGramaticais_Severidade')
BEGIN
    ALTER TABLE [dbo].[RedacaoErrosGramaticais] DROP CONSTRAINT [CK_RedacaoErrosGramaticais_Severidade]
    PRINT 'Constraint CK_RedacaoErrosGramaticais_Severidade removida!'
END
ELSE
BEGIN
    PRINT 'Constraint CK_RedacaoErrosGramaticais_Severidade não existe'
END
GO

-- Listar todas as constraints restantes nas tabelas de redação para verificação
PRINT 'Constraints restantes nas tabelas de redação:'
SELECT 
    OBJECT_NAME(parent_object_id) AS TableName,
    name AS ConstraintName,
    type_desc AS ConstraintType
FROM sys.check_constraints
WHERE OBJECT_NAME(parent_object_id) LIKE 'Redacao%'
ORDER BY TableName, name
GO

PRINT 'Limpeza de constraints concluída!'
GO
