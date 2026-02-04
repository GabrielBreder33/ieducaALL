-- Altera a coluna ConfiancaAvaliacao de decimal(3,2) para decimal(5,2)
USE IEducaDB;
GO

ALTER TABLE RedacaoCorrecoes 
ALTER COLUMN ConfiancaAvaliacao decimal(5,2) NULL;
GO

-- Verifica a alteração
SELECT COLUMN_NAME, DATA_TYPE, NUMERIC_PRECISION, NUMERIC_SCALE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'RedacaoCorrecoes' 
AND COLUMN_NAME = 'ConfiancaAvaliacao';
GO
