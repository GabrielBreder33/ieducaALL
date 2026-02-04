# Teste de geração de atividade com IA

$url = "http://localhost:5000/api/AtividadeIA/gerar"

$body = @{
    configuracao = @{
        materia = "Matemática"
        segmento = "Fundamental II"
        ano = "6º ano"
        conteudo = "Frações"
        nivel = "Médio"
        quantidade = 5
        tipo = "MultiplaEscolha"
        explicacao = $true
    }
    prompt = "Gere 5 questões sobre Frações para alunos do 6º ano, nível médio."
} | ConvertTo-Json -Depth 10

Write-Host "Enviando requisição para: $url" -ForegroundColor Cyan
Write-Host "Body:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    Write-Host "`n✅ Resposta recebida com sucesso!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor White
} catch {
    Write-Host "`n❌ Erro ao fazer requisição:" -ForegroundColor Red
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
