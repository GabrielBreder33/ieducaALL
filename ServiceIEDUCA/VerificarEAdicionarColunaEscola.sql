-- Script para adicionar coluna id_Escola na tabela Users
-- Execute este script no banco de dados iEduca

USE iEduca;
GO

-- Verificar e adicionar coluna id_Escola na tabela Users se não existir
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.Users') 
    AND name = 'id_Escola'
)
BEGIN
    ALTER TABLE Users ADD id_Escola INT NULL;
    PRINT 'Coluna id_Escola adicionada com sucesso!';
END
ELSE
BEGIN
    PRINT 'Coluna id_Escola já existe.';
END
GO

-- Adicionar chave estrangeira se não existir
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys 
    WHERE name = 'FK_Users_escola_id_Escola'
)
BEGIN
    ALTER TABLE Users
    ADD CONSTRAINT FK_Users_escola_id_Escola
    FOREIGN KEY (id_Escola) REFERENCES escola(Id);
    PRINT 'Chave estrangeira adicionada com sucesso!';
END
ELSE
BEGIN
    PRINT 'Chave estrangeira já existe.';
END
GO

-- Verificar se funcionou
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Users'
AND COLUMN_NAME = 'id_Escola';
GO
