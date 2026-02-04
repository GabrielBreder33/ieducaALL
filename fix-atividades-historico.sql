-- Atualizar todas as atividades do usuário 3007 para GeradaPorIA = 1 e Status = 'Concluída'
-- se elas não tiverem esses campos definidos

UPDATE AtividadeExecucoes
SET 
    GeradaPorIA = 1,
    Status = CASE 
        WHEN Status IS NULL OR Status = '' THEN 'Concluída'
        ELSE Status
    END
WHERE UserId = 3007
  AND (GeradaPorIA IS NULL OR GeradaPorIA = 0);

-- Verificar quantas atividades foram atualizadas
SELECT 
    COUNT(*) as TotalAtualizado
FROM AtividadeExecucoes
WHERE UserId = 3007 AND GeradaPorIA = 1;
