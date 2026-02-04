# Script PowerShell para executar a migração do banco de dados
# Este script adiciona as colunas necessárias para atividades IA

$connectionString = "Server=localhost,1433;Database=ServiceIEDUCA;User Id=sa;Password=SenhaForte@123;TrustServerCertificate=True;"

# SQL para adicionar as colunas
$sqlScript = @"
USE [ServiceIEDUCA];
GO

-- Adicionar coluna Materia
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Materia')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [Materia] NVARCHAR(100) NULL;
    PRINT 'Coluna Materia adicionada';
END
GO

-- Adicionar coluna Segmento
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Segmento')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [Segmento] NVARCHAR(50) NULL;
    PRINT 'Coluna Segmento adicionada';
END
GO

-- Adicionar coluna Ano
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Ano')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [Ano] NVARCHAR(50) NULL;
    PRINT 'Coluna Ano adicionada';
END
GO

-- Adicionar coluna Conteudo
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Conteudo')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [Conteudo] NVARCHAR(500) NULL;
    PRINT 'Coluna Conteudo adicionada';
END
GO

-- Adicionar coluna Nivel
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Nivel')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [Nivel] NVARCHAR(50) NULL;
    PRINT 'Coluna Nivel adicionada';
END
GO

-- Adicionar coluna Tipo
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'Tipo')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [Tipo] NVARCHAR(50) NULL;
    PRINT 'Coluna Tipo adicionada';
END
GO

-- Adicionar coluna GeradaPorIA
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AtividadeExecucoes]') AND name = 'GeradaPorIA')
BEGIN
    ALTER TABLE [dbo].[AtividadeExecucoes] ADD [GeradaPorIA] BIT NOT NULL DEFAULT 0;
    PRINT 'Coluna GeradaPorIA adicionada';
END
GO

-- Verificar colunas adicionadas
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'AtividadeExecucoes'
  AND COLUMN_NAME IN ('Materia', 'Segmento', 'Ano', 'Conteudo', 'Nivel', 'Tipo', 'GeradaPorIA')
ORDER BY COLUMN_NAME;
"@

try {
    Write-Host "Conectando ao banco de dados..." -ForegroundColor Yellow
    
    # Criar conexão
    $connection = New-Object System.Data.SqlClient.SqlConnection
    $connection.ConnectionString = $connectionString
    $connection.Open()
    
    Write-Host "Conexão estabelecida com sucesso!" -ForegroundColor Green
    
    # Dividir o script em batches (separados por GO)
    $batches = $sqlScript -split '\nGO\n'
    
    foreach ($batch in $batches) {
        if ($batch.Trim() -ne '') {
            $command = $connection.CreateCommand()
            $command.CommandText = $batch
            
            try {
                $command.ExecuteNonQuery() | Out-Null
                Write-Host "Batch executado com sucesso" -ForegroundColor Gray
            }
            catch {
                Write-Host "Erro ao executar batch: $_" -ForegroundColor Red
            }
        }
    }
    
    # Verificar as colunas adicionadas
    Write-Host "`nVerificando colunas adicionadas..." -ForegroundColor Yellow
    $verifyCommand = $connection.CreateCommand()
    $verifyCommand.CommandText = @"
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'AtividadeExecucoes'
  AND COLUMN_NAME IN ('Materia', 'Segmento', 'Ano', 'Conteudo', 'Nivel', 'Tipo', 'GeradaPorIA')
ORDER BY COLUMN_NAME;
"@
    
    $reader = $verifyCommand.ExecuteReader()
    $columnCount = 0
    
    Write-Host "`nColunas adicionadas:" -ForegroundColor Green
    while ($reader.Read()) {
        $columnCount++
        Write-Host "  - $($reader['COLUMN_NAME']) ($($reader['DATA_TYPE']), Nullable: $($reader['IS_NULLABLE']))" -ForegroundColor Cyan
    }
    $reader.Close()
    
    if ($columnCount -eq 7) {
        Write-Host "`n✅ Migração concluída com sucesso! Todas as 7 colunas foram adicionadas." -ForegroundColor Green
    }
    else {
        Write-Host "`n⚠️ Atenção: Esperava 7 colunas, mas encontrou $columnCount" -ForegroundColor Yellow
    }
    
    $connection.Close()
}
catch {
    Write-Host "`n❌ Erro ao executar migração: $_" -ForegroundColor Red
    if ($connection -and $connection.State -eq 'Open') {
        $connection.Close()
    }
    exit 1
}
