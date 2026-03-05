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

                var correcaoDb = await _redacaoService.IniciarCorrecaoAsync(
                    request.UserId,
                    request.AtividadeExecucaoId,
                    request.Tema,
                    request.TextoRedacao,
                    request.TipoAvaliacao ?? "ENEM");

                var ehRascunho = string.Equals(request.TipoAvaliacao, "rascunho", StringComparison.OrdinalIgnoreCase);

                return Ok(new
                {
                    id = correcaoDb.Id,
                    message = ehRascunho ? "Rascunho salvo com sucesso!" : "Redação enviada para correção!",
                    status = ehRascunho ? "rascunho" : "processando",
                    progresso = correcaoDb.Progresso
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao corrigir redação");
                return StatusCode(500, new { message = "Erro ao processar", error = ex.Message });
            }
        }

        [HttpPost("corrigir-stream")]
        public async Task CorrigirRedacaoStream([FromBody] CorrecaoRedacaoRequest request)
        {
            Response.StatusCode = 200;
            Response.ContentType = "application/x-ndjson; charset=utf-8";
            Response.Headers["Cache-Control"] = "no-cache";
            Response.Headers["X-Accel-Buffering"] = "no";

            async Task EnviarEventoAsync(object evento)
            {
                var linha = JsonSerializer.Serialize(evento) + "\n";
                await Response.WriteAsync(linha);
                await Response.Body.FlushAsync();
            }

            try
            {
                _logger.LogInformation("Recebendo redação para correção via stream");

                await EnviarEventoAsync(new { type = "progress", percent = 5, message = "Recebendo redação..." });

                var correcaoDb = await _redacaoService.IniciarCorrecaoAsync(
                    request.UserId,
                    request.AtividadeExecucaoId,
                    request.Tema,
                    request.TextoRedacao,
                    request.TipoAvaliacao ?? "ENEM");

                var ehRascunho = string.Equals(request.TipoAvaliacao, "rascunho", StringComparison.OrdinalIgnoreCase);
                var statusInicial = ehRascunho ? "rascunho" : "processando";

                await EnviarEventoAsync(new
                {
                    type = "started",
                    correcaoId = correcaoDb.Id,
                    status = statusInicial,
                    percent = correcaoDb.Progresso,
                    message = ehRascunho ? "Rascunho salvo" : "Correção iniciada"
                });

                if (ehRascunho)
                {
                    await EnviarEventoAsync(new
                    {
                        type = "completed",
                        correcaoId = correcaoDb.Id,
                        status = "rascunho",
                        percent = 100,
                        message = "Rascunho salvo com sucesso"
                    });
                    return;
                }

                var timeout = TimeSpan.FromMinutes(3);
                var inicio = DateTime.UtcNow;
                var ultimoPercent = -1;
                string ultimoStatus = string.Empty;

                while (DateTime.UtcNow - inicio < timeout)
                {
                    var statusAtual = await _context.RedacaoCorrecoes
                        .Where(r => r.Id == correcaoDb.Id)
                        .Select(r => new
                        {
                            r.Id,
                            r.Progresso,
                            r.Status,
                            r.NotaTotal,
                            r.TipoAvaliacao
                        })
                        .FirstOrDefaultAsync();

                    if (statusAtual == null)
                    {
                        await EnviarEventoAsync(new { type = "error", message = "Correção não encontrada" });
                        return;
                    }

                    var statusNormalizado = NormalizarStatus(statusAtual.Status, statusAtual.TipoAvaliacao);
                    var progresso = Math.Max(0, Math.Min(100, statusAtual.Progresso));

                    if (progresso != ultimoPercent || statusNormalizado != ultimoStatus)
                    {
                        await EnviarEventoAsync(new
                        {
                            type = "progress",
                            correcaoId = statusAtual.Id,
                            percent = progresso,
                            status = statusNormalizado,
                            message = ObterMensagemProgresso(progresso, statusNormalizado)
                        });

                        ultimoPercent = progresso;
                        ultimoStatus = statusNormalizado;
                    }

                    if (statusNormalizado == "concluida" || statusNormalizado == "erro")
                    {
                        await EnviarEventoAsync(new
                        {
                            type = "completed",
                            correcaoId = statusAtual.Id,
                            percent = progresso,
                            status = statusNormalizado,
                            notaTotal = statusAtual.NotaTotal,
                            message = statusNormalizado == "concluida" ? "Correção concluída" : "Correção finalizada com erro"
                        });
                        return;
                    }

                    await Task.Delay(1000);
                }

                await EnviarEventoAsync(new
                {
                    type = "timeout",
                    correcaoId = correcaoDb.Id,
                    percent = Math.Max(ultimoPercent, 0),
                    status = "processando",
                    message = "A correção continua em processamento. Você pode acompanhar no histórico."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no stream de correção de redação");
                await EnviarEventoAsync(new { type = "error", message = "Erro ao processar correção" });
            }
        }

        [HttpGet("progresso-stream/{id}")]
        public async Task ProgressoRedacaoStream(int id)
        {
            Response.StatusCode = 200;
            Response.ContentType = "application/x-ndjson; charset=utf-8";
            Response.Headers["Cache-Control"] = "no-cache";
            Response.Headers["X-Accel-Buffering"] = "no";

            async Task EnviarEventoAsync(object evento)
            {
                var linha = JsonSerializer.Serialize(evento) + "\n";
                await Response.WriteAsync(linha);
                await Response.Body.FlushAsync();
            }

            try
            {
                var timeout = TimeSpan.FromMinutes(3);
                var inicio = DateTime.UtcNow;
                var ultimoPercent = -1;
                string ultimoStatus = string.Empty;

                while (DateTime.UtcNow - inicio < timeout)
                {
                    var statusAtual = await _context.RedacaoCorrecoes
                        .Where(r => r.Id == id)
                        .Select(r => new
                        {
                            r.Id,
                            r.Progresso,
                            r.Status,
                            r.NotaTotal,
                            r.TipoAvaliacao
                        })
                        .FirstOrDefaultAsync();

                    if (statusAtual == null)
                    {
                        await EnviarEventoAsync(new { type = "error", message = "Correção não encontrada" });
                        return;
                    }

                    var statusNormalizado = NormalizarStatus(statusAtual.Status, statusAtual.TipoAvaliacao);
                    var progresso = Math.Max(0, Math.Min(100, statusAtual.Progresso));

                    if (progresso != ultimoPercent || statusNormalizado != ultimoStatus)
                    {
                        await EnviarEventoAsync(new
                        {
                            type = "progress",
                            correcaoId = statusAtual.Id,
                            percent = progresso,
                            status = statusNormalizado,
                            notaTotal = statusAtual.NotaTotal,
                            message = ObterMensagemProgresso(progresso, statusNormalizado)
                        });

                        ultimoPercent = progresso;
                        ultimoStatus = statusNormalizado;
                    }

                    if (statusNormalizado == "concluida" || statusNormalizado == "erro")
                    {
                        await EnviarEventoAsync(new
                        {
                            type = "completed",
                            correcaoId = statusAtual.Id,
                            percent = progresso,
                            status = statusNormalizado,
                            notaTotal = statusAtual.NotaTotal,
                            message = statusNormalizado == "concluida" ? "Correção concluída" : "Correção finalizada com erro"
                        });
                        return;
                    }

                    await Task.Delay(1000);
                }

                await EnviarEventoAsync(new
                {
                    type = "timeout",
                    correcaoId = id,
                    status = "processando",
                    percent = Math.Max(ultimoPercent, 0),
                    message = "A correção continua em processamento."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no stream de progresso da correção {CorrecaoId}", id);
                await EnviarEventoAsync(new { type = "error", message = "Erro ao acompanhar progresso" });
            }
        }

        private static string NormalizarStatus(string? status, string? tipoAvaliacao)
        {
            if (!string.IsNullOrWhiteSpace(tipoAvaliacao) && tipoAvaliacao.Equals("rascunho", StringComparison.OrdinalIgnoreCase))
                return "rascunho";

            var valor = status?.ToLowerInvariant() ?? string.Empty;
            if (valor.Contains("erro")) return "erro";
            if (valor.Contains("conclu")) return "concluida";
            return "processando";
        }

        private static string ObterMensagemProgresso(int progresso, string status)
        {
            if (status == "erro") return "Erro na correção";
            if (status == "concluida") return "Correção concluída";

            if (progresso < 20) return "Analisando texto";
            if (progresso < 60) return "Avaliando competências";
            if (progresso < 90) return "Consolidando feedback";
            return "Finalizando correção";
        }

        [HttpPost("{id}/reenviar")]
        public async Task<ActionResult<object>> ReenviarRedacao(int id)
        {
            try
            {
                _logger.LogInformation("Reenviando redação existente {CorrecaoId}", id);

                var correcaoDb = await _redacaoService.ReenviarCorrecaoAsync(id);

                return Ok(new
                {
                    id = correcaoDb.Id,
                    tema = correcaoDb.Tema,
                    message = "Redação reenviada para correção!",
                    status = "processando",
                    progresso = correcaoDb.Progresso
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Redação não encontrada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao reenviar redação {CorrecaoId}", id);
                return StatusCode(500, new { message = "Erro ao reenviar redação", error = ex.Message });
            }
        }

        [HttpPut("{id}/rascunho")]
        public async Task<ActionResult<object>> AtualizarRascunho(int id, [FromBody] AtualizarRascunhoRequest request)
        {
            try
            {
                var redacao = await _context.RedacaoCorrecoes
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (redacao == null)
                    return NotFound(new { message = "Rascunho não encontrado" });

                if (!string.Equals(redacao.TipoAvaliacao, "rascunho", StringComparison.OrdinalIgnoreCase))
                    return BadRequest(new { message = "A redação informada não é um rascunho" });

                redacao.Tema = string.IsNullOrWhiteSpace(request.Tema) ? "Rascunho sem tema" : request.Tema;
                redacao.TextoRedacao = request.TextoRedacao;
                redacao.AtualizadoEm = DateTime.UtcNow;
                redacao.Status = "Rascunho";
                redacao.ResumoFinal = "Rascunho salvo";
                redacao.Progresso = 0;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    id = redacao.Id,
                    tema = redacao.Tema,
                    status = "rascunho",
                    message = "Rascunho atualizado com sucesso"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar rascunho {CorrecaoId}", id);
                return StatusCode(500, new { message = "Erro ao atualizar rascunho", error = ex.Message });
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
                        status = r.TipoAvaliacao != null && r.TipoAvaliacao.ToLower() == "rascunho"
                            ? "rascunho"
                            : r.Status != null && r.Status.ToLower().Contains("erro")
                            ? "erro"
                            : (r.Status != null && r.Status.ToLower().Contains("conclu"))
                                ? "concluida"
                                : "processando",
                        progresso = r.Progresso,
                        notaTotal = r.NotaTotal,
                        tipoAvaliacao = r.TipoAvaliacao
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
                        status = r.TipoAvaliacao != null && r.TipoAvaliacao.ToLower() == "rascunho"
                            ? "rascunho"
                            : r.Status != null && r.Status.ToLower().Contains("erro")
                            ? "erro"
                            : (r.Status != null && r.Status.ToLower().Contains("conclu"))
                                ? "concluida"
                                : "processando",
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
                    tipoAvaliacao = correcaoDb.TipoAvaliacao,
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

    public class AtualizarRascunhoRequest
    {
        public string Tema { get; set; } = string.Empty;
        public string TextoRedacao { get; set; } = string.Empty;
    }
}
