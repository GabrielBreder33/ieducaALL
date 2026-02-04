-- Verificar total de atividades do usuário 3007
SELECT 
    COUNT(*) as Total,
    SUM(CASE WHEN GeradaPorIA = 1 THEN 1 ELSE 0 END) as ComGeradaPorIA,
    SUM(CASE WHEN Status = 'Concluída' THEN 1 ELSE 0 END) as ComStatusConcluida,
    SUM(CASE WHEN GeradaPorIA = 1 AND Status = 'Concluída' THEN 1 ELSE 0 END) as GeradaPorIA_E_Concluida
FROM AtividadeExecucoes
WHERE UserId = 3007;

-- Verificar valores distintos de GeradaPorIA
SELECT DISTINCT GeradaPorIA, COUNT(*) as Quantidade
FROM AtividadeExecucoes
WHERE UserId = 3007
GROUP BY GeradaPorIA;

-- Verificar valores distintos de Status
SELECT DISTINCT Status, COUNT(*) as Quantidade
FROM AtividadeExecucoes
WHERE UserId = 3007
GROUP BY Status;

-- Mostrar algumas atividades com detalhes
SELECT TOP 10
    Id,
    GeradaPorIA,
    Status,
    Materia,
    DataFim,
    Nota
FROM AtividadeExecucoes
WHERE UserId = 3007
ORDER BY Id DESC;
