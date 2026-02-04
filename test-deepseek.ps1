# Teste de geração de atividade com DeepSeek

$url = "http://localhost:5000/api/AtividadeIA/gerar"

$body = @{
    configuracao = @{
        materia = "Matemática"
        segmento = "Fundamental II"
        ano = "7º ano"
        conteudo = "Frações e operações com frações"
        nivel = "Médio"
        quantidade = 3
        tipo = "MultiplaEscolha"
        explicacao = $true
    }
    prompt = ""
} | ConvertTo-Json -Depth 10

Write-Host "Testando geracao com DeepSeek..." -ForegroundColor Cyan
Write-Host "Aguarde, a IA esta gerando as questoes..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 60
    Write-Host "Atividade gerada com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "QUESTOES GERADAS:" -ForegroundColor Cyan
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor White
} catch {
    Write-Host "Erro ao gerar atividade:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Resposta do servidor:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Gray
    }
}
