# Fix final - Força todas as substituições
Write-Host "🔧 Aplicando correção final..." -ForegroundColor Cyan

$historico = "d:\Projetos\I Educa\iEduca\src\pages\Aluno\Redacao\HistoricoRedacoes.tsx"

# Ler arquivo
$linhas = Get-Content $historico -Encoding UTF8

# Substituir linha por linha
for ($i = 0; $i -lt $linhas.Count; $i++) {
    # Substituir TODAS as variações
    $linhas[$i] = $linhas[$i] -replace "status === 'concluida'", "status === 'concluída'"
    $linhas[$i] = $linhas[$i] -replace "status: 'processando' \| 'concluida' \| 'erro'", "status: 'processando' | 'concluída' | 'erro'"
    $linhas[$i] = $linhas[$i] -replace "case 'concluida':", "case 'concluída':"
}

# Salvar
[System.IO.File]::WriteAllLines($historico, $linhas, [System.Text.Encoding]::UTF8)

Write-Host "✅ HistoricoRedacoes.tsx corrigido!" -ForegroundColor Green

# Verificar
Write-Host "`n📊 Verificando resultado:" -ForegroundColor Cyan
$conteudo = Get-Content $historico -Raw
if ($conteudo -match "status === 'concluida'") {
    Write-Host "❌ Ainda há 'concluida' sem acento!" -ForegroundColor Red
} else {
    Write-Host "✅ Todas as ocorrências foram corrigidas!" -ForegroundColor Green
}
