-- Script para adicionar campo Tipo na tabela AtividadeExecucoes se não existir
USE ServiceIEDUCA;
GO

-- Verificar se a coluna existe
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'AtividadeExecucoes' 
    AND COLUMN_NAME = 'Tipo'
)
BEGIN
    PRINT 'Adicionando coluna Tipo...'
    ALTER TABLE AtividadeExecucoes
    ADD Tipo NVARCHAR(50) NULL;
    
    PRINT 'Coluna Tipo adicionada com sucesso!'
END
ELSE
BEGIN
    PRINT 'Coluna Tipo já existe!'
END
GO

-- Atualizar registros NULL para 'Múltipla Escolha'
UPDATE AtividadeExecucoes
SET Tipo = N'Múltipla Escolha'
WHERE Tipo IS NULL;
GO

PRINT 'Registros atualizados!'
GO

-- Verificar resultado
SELECT TOP 5 Id, Tipo, GeradaPorIA, Status, TotalQuestoes
FROM AtividadeExecucoes
ORDER BY CriadoEm DESC;
GO
