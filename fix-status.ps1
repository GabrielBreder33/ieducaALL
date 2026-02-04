# Script para corrigir status das redações
# HistoricoRedacoes: 'concluída' → 'concluida' (SEM acento)
# RedacaoCorrecaoView: 'concluida' → 'concluída' (COM acento)

Write-Host "🔧 Corrigindo status das redações..." -ForegroundColor Cyan

# Caminho dos arquivos
$historico = "d:\Projetos\I Educa\iEduca\src\pages\Aluno\Redacao\HistoricoRedacoes.tsx"
$correcaoView = "d:\Projetos\I Educa\iEduca\src\pages\Aluno\Redacao\RedacaoCorrecaoView.tsx"

# Backup
Write-Host "📦 Criando backup..." -ForegroundColor Yellow
Copy-Item $historico "$historico.backup"
Copy-Item $correcaoView "$correcaoView.backup"

# Fix HistoricoRedacoes.tsx - Remover acento
Write-Host "📝 Corrigindo HistoricoRedacoes.tsx (removendo acento)..." -ForegroundColor Green
$conteudo = Get-Content $historico -Raw -Encoding UTF8
$conteudo = $conteudo -replace "status: 'processando' \| 'concluída' \| 'erro'", "status: 'processando' | 'concluida' | 'erro'"
$conteudo = $conteudo -replace "case 'concluída':", "case 'concluida':"
$conteudo = $conteudo -replace "r\.status === 'concluída'", "r.status === 'concluida'"
[System.IO.File]::WriteAllText($historico, $conteudo, [System.Text.Encoding]::UTF8)

# Fix RedacaoCorrecaoView.tsx - Adicionar acento
Write-Host "📝 Corrigindo RedacaoCorrecaoView.tsx (adicionando acento)..." -ForegroundColor Green
$conteudo = Get-Content $correcaoView -Raw -Encoding UTF8
$conteudo = $conteudo -replace "progressData\.status === 'concluida'", "progressData.status === 'concluída'"
$conteudo = $conteudo -replace "status === 'concluida'", "status === 'concluída'"
[System.IO.File]::WriteAllText($correcaoView, $conteudo, [System.Text.Encoding]::UTF8)

Write-Host "✅ Correções aplicadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Resumo:" -ForegroundColor Cyan
Write-Host "  • HistoricoRedacoes.tsx: 'concluída' → 'concluida' (SEM acento)" -ForegroundColor White
Write-Host "  • RedacaoCorrecaoView.tsx: 'concluida' → 'concluída' (COM acento)" -ForegroundColor White
Write-Host ""
Write-Host "💾 Backups salvos em:" -ForegroundColor Yellow
Write-Host "  • $historico.backup" -ForegroundColor Gray
Write-Host "  • $correcaoView.backup" -ForegroundColor Gray
