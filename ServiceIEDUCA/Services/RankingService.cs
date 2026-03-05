using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.DTOs;

namespace ServiceIEDUCA.Services
{
    public class RankingService : IRankingService
    {
        private readonly AppDbContext _context;

        public RankingService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<RankingResponseDto> ObterRankingPorEscolaAsync(int escolaId, string periodo)
        {
            var (dataInicio, dataFim, periodoNormalizado) = ObterJanelaTemporal(periodo);

            var escola = await _context.escola
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == escolaId);

            var alunos = await _context.Users
                .AsNoTracking()
                .Where(u => u.id_Escola == escolaId && u.Ativo)
                .Where(u => EF.Functions.ILike(u.Role, "aluno"))
                .Select(u => new { u.Id, u.Nome })
                .ToListAsync();

            var alunosIds = alunos.Select(a => a.Id).ToList();

            var response = new RankingResponseDto
            {
                Periodo = periodoNormalizado,
                DataInicio = dataInicio,
                DataFim = dataFim,
                EscolaId = escolaId,
                EscolaNome = escola?.Nome ?? "Escola"
            };

            if (!alunosIds.Any())
            {
                return response;
            }

            var redacoes = await _context.RedacaoCorrecoes
                .AsNoTracking()
                .Where(r => alunosIds.Contains(r.UserId))
                .Where(r => r.NotaTotal > 0)
                .Where(r => string.IsNullOrEmpty(r.TipoAvaliacao) || !EF.Functions.ILike(r.TipoAvaliacao!, "rascunho"))
                .Where(r => !string.IsNullOrEmpty(r.Status) && EF.Functions.ILike(r.Status!, "%conclu%"))
                .Select(r => new
                {
                    r.UserId,
                    r.NotaTotal,
                    r.CriadoEm,
                    r.AtualizadoEm
                })
                .ToListAsync();

            var redacaoStats = redacoes
                .Where(r => DentroDoPeriodo(r.AtualizadoEm ?? r.CriadoEm, dataInicio, dataFim))
                .GroupBy(r => r.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    Media = g.Average(x => x.NotaTotal),
                    Total = g.Count(),
                    UltimaData = g.Max(x => x.AtualizadoEm ?? x.CriadoEm)
                })
                .ToDictionary(x => x.UserId);

            var atividades = await _context.AtividadeExecucoes
                .AsNoTracking()
                .Where(a => alunosIds.Contains(a.UserId))
                .Where(a => a.Nota.HasValue && a.Nota.Value > 0)
                .Where(a => !string.IsNullOrEmpty(a.Status) && EF.Functions.ILike(a.Status!, "%conclu%"))
                .Select(a => new
                {
                    a.UserId,
                    Nota = a.Nota!.Value,
                    a.CriadoEm,
                    a.DataFim
                })
                .ToListAsync();

            var atividadeStats = atividades
                .Where(a => DentroDoPeriodo(a.DataFim ?? a.CriadoEm, dataInicio, dataFim))
                .GroupBy(a => a.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    Media = g.Average(x => x.Nota),
                    Total = g.Count(),
                    UltimaData = g.Max(x => x.DataFim ?? x.CriadoEm)
                })
                .ToDictionary(x => x.UserId);

            var ranking = new List<RankingAlunoDto>();

            foreach (var aluno in alunos)
            {
                redacaoStats.TryGetValue(aluno.Id, out var redacao);
                atividadeStats.TryGetValue(aluno.Id, out var atividade);

                var mediaRedacao = redacao?.Media ?? 0m;
                var mediaAtividadeRaw = atividade?.Media ?? 0m; // escala 0-10
                var mediaAtividadeNormalizada = mediaAtividadeRaw * 100m; // converte para 0-1000

                var mediaFinal = CalcularMediaFinal(mediaRedacao, mediaAtividadeNormalizada);
                var ultimaData = MaiorData(redacao?.UltimaData, atividade?.UltimaData);

                ranking.Add(new RankingAlunoDto
                {
                    UserId = aluno.Id,
                    Nome = aluno.Nome,
                    EscolaId = escolaId,
                    EscolaNome = response.EscolaNome,
                    MediaRedacao = decimal.Round(mediaRedacao, 2),
                    MediaAtividadesRaw = decimal.Round(mediaAtividadeRaw, 2),
                    MediaAtividades = decimal.Round(mediaAtividadeNormalizada, 2),
                    MediaFinal = decimal.Round(mediaFinal, 2),
                    TotalRedacoes = redacao?.Total ?? 0,
                    TotalAtividades = atividade?.Total ?? 0,
                    UltimaAtualizacao = ultimaData
                });
            }

            var ordenado = ranking
                .OrderByDescending(r => r.MediaFinal)
                .ThenByDescending(r => r.MediaRedacao)
                .ThenByDescending(r => r.TotalRedacoes)
                .ThenBy(r => r.Nome)
                .ToList();

            for (int i = 0; i < ordenado.Count; i++)
            {
                ordenado[i].Posicao = i + 1;
            }

            response.Alunos = ordenado;
            return response;
        }

        private static (DateTime inicio, DateTime fim, string periodoNormalizado) ObterJanelaTemporal(string? periodo)
        {
            var hoje = DateTime.UtcNow;
            var fim = hoje;
            var chave = (periodo ?? "mensal").Trim().ToLower();

            return chave switch
            {
                "anual" => (hoje.AddYears(-1), fim, "anual"),
                "semestral" => (hoje.AddMonths(-6), fim, "semestral"),
                _ => (hoje.AddMonths(-1), fim, "mensal")
            };
        }

        private static bool DentroDoPeriodo(DateTime? data, DateTime inicio, DateTime fim)
        {
            if (data == null)
            {
                return false;
            }

            var valor = data.Value;
            return valor >= inicio && valor <= fim;
        }

        private static decimal CalcularMediaFinal(decimal mediaRedacao, decimal mediaAtividadeNormalizada)
        {
            if (mediaRedacao == 0 && mediaAtividadeNormalizada == 0)
            {
                return 0;
            }

            if (mediaRedacao == 0)
            {
                return mediaAtividadeNormalizada;
            }

            if (mediaAtividadeNormalizada == 0)
            {
                return mediaRedacao;
            }

            return (mediaRedacao + mediaAtividadeNormalizada) / 2m;
        }

        private static DateTime? MaiorData(DateTime? a, DateTime? b)
        {
            if (a == null) return b;
            if (b == null) return a;
            return a > b ? a : b;
        }
    }
}
