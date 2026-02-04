using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.Models;
using ServiceIEDUCA.Services;
using System.Text.Json;

namespace ServiceIEDUCA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RedacaoCorrecaoController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<RedacaoCorrecaoController> _logger;
        private readonly IRedacaoCorrecaoService _redacaoService;

        public RedacaoCorrecaoController(
            AppDbContext context, 
            ILogger<RedacaoCorrecaoController> logger,
            IRedacaoCorrecaoService redacaoService)
        {
            _context = context;
            _logger = logger;
            _redacaoService = redacaoService;
        }

        [HttpPost("corrigir")]
        public async Task<ActionResult<object>> CorrigirRedacao([FromBody] CorrecaoRedacaoRequest request)
        {
            try
            {
                _logger.LogInformation("Recebendo redação para correção");

                var correcaoDb = new RedacaoCorrecoes
                {
                    UserId = request.UserId,
                    Tema = request.Tema,
                    TextoRedacao = request.TextoRedacao,
                    NotaZero = false,
                    NotaTotal = 0,
                    ResumoFinal = "Processando correção...",
                    ConfiancaAvaliacao = null,
                    Status = "Processando",
                    Progresso = 10,
                    TipoAvaliacao = request.TipoAvaliacao ?? "ENEM",
                    CriadoEm = DateTime.Now
                };

                _context.RedacaoCorrecoes.Add(correcaoDb);
                await _context.SaveChangesAsync();

                _ = Task.Run(async () => await _redacaoService.ProcessarCorrecaoAsync(correcaoDb.Id));

                return Ok(new
                {
                    id = correcaoDb.Id,
                    message = "Redação enviada para correção!",
                    status = correcaoDb.Status,
                    progresso = correcaoDb.Progresso
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao corrigir redação");
                return StatusCode(500, new { message = "Erro ao processar", error = ex.Message });
            }
        }

        [HttpGet("usuario/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetRedacoesUsuario(int userId)
        {
            try
            {
                var redacoes = await _context.RedacaoCorrecoes
                    .Where(r => r.UserId == userId)
                    .OrderByDescending(r => r.CriadoEm)
                    .Select(r => new
                    {
                        id = r.Id,
                        tema = r.Tema ?? "Sem Tema",
                        dataEnvio = r.CriadoEm,
                        status = (r.Progresso >= 100 || r.NotaTotal > 0) ? "concluida" : "processando",
                        progresso = r.Progresso,
                        notaTotal = r.NotaTotal
                    })
                    .ToListAsync();

                return Ok(redacoes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar redações");
                return StatusCode(500, new { message = "Erro", error = ex.Message });
            }
        }

        [HttpGet("progresso-status/{id}")]
        public async Task<ActionResult<object>> GetProgressoStatus(int id)
        {
            try
            {
                var correcao = await _context.RedacaoCorrecoes
                    .Where(r => r.Id == id)
                    .Select(r => new
                    {
                        correcaoId = r.Id,
                        progresso = r.Progresso,
                        status = r.Status != null ? r.Status.ToLower() : "processando",
                        notaTotal = r.NotaTotal
                    })
                    .FirstOrDefaultAsync();

                if (correcao == null)
                {
                    return NotFound(new { message = "Correção não encontrada" });
                }

                return Ok(correcao);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar progresso");
                return StatusCode(500, new { message = "Erro", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetRedacao(int id)
        {
            try
            {
                var correcaoDb = await _context.RedacaoCorrecoes
                    .Include(r => r.Competencias)
                    .Include(r => r.ErrosGramaticais)
                    .Include(r => r.Feedbacks)
                    .Include(r => r.PropostaIntervencao)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (correcaoDb == null)
                {
                    return NotFound(new { message = "Redação não encontrada" });
                }

                var feedbacksAgrupados = new
                {
                    pontosPositivos = (correcaoDb.Feedbacks ?? new List<RedacaoFeedbacks>())
                        .Where(f => f.Tipo == "positive")
                        .OrderBy(f => f.Ordem)
                        .Select(f => f.Conteudo)
                        .ToArray(),
                    pontosMelhoria = (correcaoDb.Feedbacks ?? new List<RedacaoFeedbacks>())
                        .Where(f => f.Tipo == "negative")
                        .OrderBy(f => f.Ordem)
                        .Select(f => f.Conteudo)
                        .ToArray(),
                    recomendacoes = (correcaoDb.Feedbacks ?? new List<RedacaoFeedbacks>())
                        .Where(f => f.Tipo == "recommendation")
                        .OrderBy(f => f.Ordem)
                        .Select(f => f.Conteudo)
                        .ToArray()
                };

                var correcao = new
                {
                    id = correcaoDb.Id,
                    tema = correcaoDb.Tema,
                    textoRedacao = correcaoDb.TextoRedacao,
                    notaZero = correcaoDb.NotaZero,
                    notaTotal = correcaoDb.NotaTotal,
                    resumoFinal = correcaoDb.ResumoFinal,
                    competencias = (correcaoDb.Competencias ?? new List<RedacaoCompetencias>()).OrderBy(c => c.NumeroCompetencia).Select(c => new
                    {
                        numeroCompetencia = c.NumeroCompetencia,
                        nomeCompetencia = c.NomeCompetencia,
                        nota = c.Nota,
                        comentario = c.Comentario,
                        evidencias = string.IsNullOrEmpty(c.Evidencias) ? new string[0] : JsonSerializer.Deserialize<string[]>(c.Evidencias),
                        melhorias = string.IsNullOrEmpty(c.Melhorias) ? new string[0] : JsonSerializer.Deserialize<string[]>(c.Melhorias)
                    }).ToArray(),
                    errosGramaticais = (correcaoDb.ErrosGramaticais ?? new List<RedacaoErrosGramaticais>()).Select(e => new
                    {
                        posicaoInicio = e.PosicaoInicio,
                        posicaoFim = e.PosicaoFim,
                        textoOriginal = e.TextoOriginal,
                        textoSugerido = e.TextoSugerido,
                        explicacao = e.Explicacao,
                        severidade = e.Severidade
                    }).ToArray(),
                    feedbacks = feedbacksAgrupados,
                    propostaIntervencao = correcaoDb.PropostaIntervencao == null ? null : new
                    {
                        avaliacao = correcaoDb.PropostaIntervencao.Avaliacao,
                        sugestoesConcretas = correcaoDb.PropostaIntervencao.SugestoesConcretas
                    },
                    versaoReescrita = correcaoDb.VersaoReescrita,
                    confiancaAvaliacao = correcaoDb.ConfiancaAvaliacao,
                    status = correcaoDb.Status,
                    progresso = correcaoDb.Progresso
                };

                return Ok(correcao);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar redação");
                return StatusCode(500, new { message = "Erro", error = ex.Message });
            }
        }
    }

    public class CorrecaoRedacaoRequest
    {
        public int UserId { get; set; }
        public int? AtividadeExecucaoId { get; set; }
        public string Tema { get; set; } = string.Empty;
        public string TextoRedacao { get; set; } = string.Empty;
        public string? TipoAvaliacao { get; set; }
    }
}
