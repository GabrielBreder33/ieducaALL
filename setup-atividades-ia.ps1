# Script para aplicar alterações nas Atividades IA
# Execute este script no PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SETUP - Atividades IA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 PASSO 1: Executar SQL no Banco de Dados" -ForegroundColor Yellow
Write-Host ""
Write-Host "Abra o SQL Server Management Studio (SSMS) e execute o arquivo:" -ForegroundColor White
Write-Host "ServiceIEDUCA\Migrations\AddAtividadeIAFields.sql" -ForegroundColor Green
Write-Host ""
Write-Host "Este script vai adicionar as seguintes colunas na tabela AtividadeExecucoes:" -ForegroundColor White
Write-Host "  - Materia (NVARCHAR 100)" -ForegroundColor Gray
Write-Host "  - Segmento (NVARCHAR 50)" -ForegroundColor Gray
Write-Host "  - Ano (NVARCHAR 50)" -ForegroundColor Gray
Write-Host "  - Conteudo (NVARCHAR 500)" -ForegroundColor Gray
Write-Host "  - Nivel (NVARCHAR 50)" -ForegroundColor Gray
Write-Host "  - Tipo (NVARCHAR 50)" -ForegroundColor Gray
Write-Host "  - GeradaPorIA (BIT)" -ForegroundColor Gray
Write-Host ""

$executouSQL = Read-Host "Você já executou o script SQL? (S/N)"

if ($executouSQL -ne 'S' -and $executouSQL -ne 's') {
    Write-Host ""
    Write-Host "❌ Execute primeiro o script SQL antes de continuar!" -ForegroundColor Red
    Write-Host "Caminho: ServiceIEDUCA\Migrations\AddAtividadeIAFields.sql" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit
}

Write-Host ""
Write-Host "✅ Script SQL executado com sucesso!" -ForegroundColor Green
Write-Host ""

Write-Host "📋 PASSO 2: Reiniciar Backend" -ForegroundColor Yellow
Write-Host ""
Write-Host "INSTRUÇÕES:" -ForegroundColor White
Write-Host "1. No terminal 'dotnet', pressione Ctrl+C para parar o servidor" -ForegroundColor White
Write-Host "2. Execute novamente: dotnet run" -ForegroundColor White
Write-Host ""

Read-Host "Pressione ENTER após reiniciar o backend"

Write-Host ""
Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Acesse: http://localhost:3000/aluno/atividades" -ForegroundColor White
Write-Host "2. A página deve carregar sem erros" -ForegroundColor White
Write-Host "3. O histórico de atividades estará vazio até gerar atividades com IA" -ForegroundColor White
Write-Host ""
Write-Host "📝 NOTA IMPORTANTE:" -ForegroundColor Yellow
Write-Host "Para que atividades apareçam no histórico, elas precisam:" -ForegroundColor White
Write-Host "  - Ser geradas pela funcionalidade 'Gerar com IA'" -ForegroundColor Gray
Write-Host "  - Ter o campo GeradaPorIA = 1 no banco de dados" -ForegroundColor Gray
Write-Host "  - Estar com Status = 'Concluída'" -ForegroundColor Gray
Write-Host ""

Read-Host "Pressione ENTER para finalizar"
