# Script de teste da API

Write-Host "🧪 Testando API do ServiceIEDUCA..." -ForegroundColor Cyan

# Teste 1: Verificar se o servidor está online
Write-Host "`n1. Testando conexão com o servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/User" -Method GET -UseBasicParsing
    Write-Host "✅ Servidor online!" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor offline ou com problemas: $_" -ForegroundColor Red
    exit
}

# Teste 2: Tentar iniciar uma atividade
Write-Host "`n2. Testando iniciar atividade..." -ForegroundColor Yellow
$body = @{
    userId = 1
    atividadeId = 1
    totalQuestoes = 10
} | ConvertTo-Json

Write-Host "Body: $body" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:5000/api/AtividadeExecucoes/iniciar" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing
    
    Write-Host "✅ Atividade iniciada com sucesso!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro ao iniciar atividade:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalhes: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`n✅ Teste concluído!" -ForegroundColor Cyan
