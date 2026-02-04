-- ===================================================================
-- Script para padronizar Status das Redações no Banco de Dados
-- ===================================================================
-- Problema: Alguns registros têm 'concluida' e outros 'Concluída'
-- Solução: Padronizar TUDO para 'Concluída' (com acento e maiúscula)
-- ===================================================================

USE [ServiceIeduca];
GO

-- 1️⃣ VERIFICAR ESTADO ATUAL
PRINT '📊 ESTADO ATUAL DO BANCO:';
PRINT '';

SELECT 
    Status,
    COUNT(*) AS Quantidade,
    LOWER(Status) AS StatusLowerCase
FROM RedacaoCorrecoes
GROUP BY Status
ORDER BY COUNT(*) DESC;

PRINT '';
PRINT '-------------------------------------------------------------------';
PRINT '';

-- 2️⃣ PADRONIZAR TODOS OS STATUS
PRINT '🔧 APLICANDO CORREÇÕES...';
PRINT '';

-- Corrigir 'concluida' → 'Concluída'
UPDATE RedacaoCorrecoes
SET Status = 'Concluída'
WHERE LOWER(Status) = 'concluida' AND Status != 'Concluída';

PRINT '✅ Status "concluida" corrigidos para "Concluída"';
PRINT CONCAT('   Registros afetados: ', @@ROWCOUNT);

-- Corrigir 'Concluida' → 'Concluída' (caso exista sem acento)
UPDATE RedacaoCorrecoes
SET Status = 'Concluída'
WHERE Status = 'Concluida';

PRINT '✅ Status "Concluida" corrigidos para "Concluída"';
PRINT CONCAT('   Registros afetados: ', @@ROWCOUNT);

-- Corrigir 'processando' → 'Processando'
UPDATE RedacaoCorrecoes
SET Status = 'Processando'
WHERE LOWER(Status) = 'processando' AND Status != 'Processando';

PRINT '✅ Status "processando" corrigidos para "Processando"';
PRINT CONCAT('   Registros afetados: ', @@ROWCOUNT);

-- Corrigir 'erro' → 'Erro'
UPDATE RedacaoCorrecoes
SET Status = 'Erro'
WHERE LOWER(Status) = 'erro' AND Status != 'Erro';

PRINT '✅ Status "erro" corrigidos para "Erro"';
PRINT CONCAT('   Registros afetados: ', @@ROWCOUNT);

PRINT '';
PRINT '-------------------------------------------------------------------';
PRINT '';

-- 3️⃣ VERIFICAR RESULTADO FINAL
PRINT '📊 ESTADO FINAL DO BANCO:';
PRINT '';

SELECT 
    Status,
    COUNT(*) AS Quantidade,
    LOWER(Status) AS StatusLowerCase
FROM RedacaoCorrecoes
GROUP BY Status
ORDER BY COUNT(*) DESC;

PRINT '';
PRINT '✅ PADRONIZAÇÃO CONCLUÍDA!';
PRINT '';
PRINT '📋 Valores padronizados:';
PRINT '   • Concluída  → LOWER() = "concluída" (com acento)';
PRINT '   • Processando → LOWER() = "processando"';
PRINT '   • Erro       → LOWER() = "erro"';
PRINT '';
PRINT '🔍 Agora todos os endpoints retornarão valores consistentes!';

GO
