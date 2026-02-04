using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;

namespace ServiceIEDUCA.Services
{
    public class RedacaoBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<RedacaoBackgroundService> _logger;

        public RedacaoBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<RedacaoBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("RedacaoBackgroundService iniciado");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessarCorrecoesPendentesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro no processamento de correções em background");
                }

                // Aguardar 30 segundos antes de verificar novamente
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }

        private async Task ProcessarCorrecoesPendentesAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var redacaoService = scope.ServiceProvider.GetRequiredService<IRedacaoCorrecaoService>();

            // Buscar correções que estão travadas há mais de 5 minutos
            var correcoesTravadas = await context.RedacaoCorrecoes
                .Where(r => r.Status == "Processando" && 
                           r.Progresso < 100 &&
                           r.CriadoEm < DateTime.Now.AddMinutes(-5))
                .ToListAsync(cancellationToken);

            foreach (var correcao in correcoesTravadas)
            {
                _logger.LogWarning($"Reprocessando correção travada: {correcao.Id}");
                
                try
                {
                    await redacaoService.ProcessarCorrecaoAsync(correcao.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Erro ao reprocessar correção {correcao.Id}");
                    await redacaoService.AtualizarProgressoAsync(correcao.Id, 0, "Erro");
                }
            }
        }
    }
}
