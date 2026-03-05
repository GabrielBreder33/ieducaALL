using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Models;
using ServiceIEDUCA.Services;
using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace ServiceIEDUCA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AtividadeIAController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AtividadeIAController> _logger;
        private readonly IDeepSeekService _deepSeekService;

        public AtividadeIAController(
            AppDbContext context, 
            ILogger<AtividadeIAController> logger,
            IDeepSeekService deepSeekService)
        {
            _context = context;
            _logger = logger;
            _deepSeekService = deepSeekService;
        }

        // GET: api/AtividadeIA/historico/{userId}
        [HttpGet("historico/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetHistoricoUsuario(int userId)
        {
            try
            {
                _logger.LogInformation($"Buscando histórico de atividades IA para o usuário {userId}");

                var atividadesIaUsuario = _context.AtividadeExecucoes
                    .Where(e => e.UserId == userId)
                    .Where(e =>
                        e.GeradaPorIA == true ||
                        e.AtividadeId == 0 ||
                        !string.IsNullOrEmpty(e.QuestoesJson) ||
                        !string.IsNullOrEmpty(e.GabaritoJson));

                // Primeiro, contar TODAS as atividades IA do usuário
                var totalTodasAtividades = await atividadesIaUsuario
                    .CountAsync();
                    
                var totalConcluidas = await atividadesIaUsuario
                    .Where(e => !string.IsNullOrEmpty(e.Status) && e.Status!.ToLower().StartsWith("conclu"))
                    .CountAsync();
                    
                _logger.LogInformation($"📊 Usuário {userId}: {totalTodasAtividades} atividades IA no total, {totalConcluidas} concluídas");

                // Buscar todas as execuções de atividades IA do usuário
                var execucoes = await atividadesIaUsuario
                    .Where(e => !string.IsNullOrEmpty(e.Status) && e.Status!.ToLower().StartsWith("conclu"))
                    .OrderByDescending(e => e.DataInicio)
                    .Take(100)
                    .Select(e => new
                    {
                        id = e.Id,
                        userId = e.UserId,
                        atividadeId = e.AtividadeId.ToString(),
                        materia = e.Materia ?? "Geral",
                        segmento = e.Segmento ?? "",
                        ano = e.Ano ?? "",
                        conteudo = e.Conteudo ?? "",
                        nivel = e.Nivel ?? "Médio",
                        tipo = e.Tipo ?? "Múltipla Escolha",
                        totalQuestoes = e.TotalQuestoes,
                        acertos = e.Acertos,
                        erros = e.Erros,
                        nota = e.Nota ?? 0,
                        percentual = e.TotalQuestoes > 0 ? ((decimal)e.Acertos / e.TotalQuestoes) * 100 : 0,
                        realizadaEm = e.DataFim ?? e.DataInicio,
                        dataFim = e.DataFim,
                        tempoGastoSegundos = e.TempoGastoSegundos
                    })
                    .ToListAsync();

                _logger.LogInformation($"Encontradas {execucoes.Count} atividades IA concluídas para o usuário {userId}");

                return Ok(execucoes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao buscar histórico de atividades IA do usuário {userId}");
                return StatusCode(500, new { message = "Erro ao buscar histórico de atividades", error = ex.Message });
            }
        }

        // GET: api/AtividadeIA/historico/{userId}/{execucaoId}
        [HttpGet("historico/{userId}/{execucaoId}")]
        public async Task<ActionResult<object>> GetDetalheAtividade(int userId, int execucaoId)
        {
            try
            {
                _logger.LogInformation($"Buscando detalhes da execução {execucaoId} para o usuário {userId}");

                var execucao = await _context.AtividadeExecucoes
                    .Where(e => e.UserId == userId && e.Id == execucaoId)
                    .Where(e =>
                        e.GeradaPorIA == true ||
                        e.AtividadeId == 0 ||
                        !string.IsNullOrEmpty(e.QuestoesJson) ||
                        !string.IsNullOrEmpty(e.GabaritoJson))
                    .FirstOrDefaultAsync();

                if (execucao == null)
                {
                    _logger.LogWarning($"Execução {execucaoId} não encontrada para o usuário {userId}");
                    return NotFound(new { message = "Atividade não encontrada" });
                }

                _logger.LogInformation($"Execução encontrada: ID={execucao.Id}, Matéria={execucao.Materia}, Nota={execucao.Nota}");

                // Deserializar os JSONs salvos
                List<object>? questoes = null;
                List<object>? gabarito = null;
                List<object>? respostas = null;

                try
                {
                    if (!string.IsNullOrEmpty(execucao.QuestoesJson))
                    {
                        questoes = JsonSerializer.Deserialize<List<object>>(execucao.QuestoesJson);
                    }
                    if (!string.IsNullOrEmpty(execucao.GabaritoJson))
                    {
                        gabarito = JsonSerializer.Deserialize<List<object>>(execucao.GabaritoJson);
                    }
                    if (!string.IsNullOrEmpty(execucao.RespostasJson))
                    {
                        respostas = JsonSerializer.Deserialize<List<object>>(execucao.RespostasJson);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao deserializar JSONs da atividade");
                }

                var detalhe = new
                {
                    id = execucao.Id,
                    atividadeId = execucao.AtividadeId.ToString(),
                    nome = $"{execucao.Materia} - {execucao.Conteudo}",
                    descricao = $"{execucao.Tipo} - Nível {execucao.Nivel}",
                    materia = execucao.Materia ?? "Geral",
                    segmento = execucao.Segmento,
                    ano = execucao.Ano,
                    conteudo = execucao.Conteudo,
                    nivel = execucao.Nivel,
                    tipo = execucao.Tipo,
                    nota = execucao.Nota ?? 0,
                    totalQuestoes = execucao.TotalQuestoes,
                    questoesCertas = execucao.Acertos,
                    questoesErradas = execucao.Erros,
                    percentual = execucao.TotalQuestoes > 0 ? ((decimal)execucao.Acertos / execucao.TotalQuestoes) * 100 : 0,
                    realizadaEm = execucao.DataInicio,
                    dataFim = execucao.DataFim,
                    tempoDecorridoSegundos = execucao.TempoGastoSegundos,
                    questoes = questoes,
                    gabarito = gabarito,
                    respostas = respostas
                };

                _logger.LogInformation($"Retornando detalhes da execução {execucaoId} com {questoes?.Count ?? 0} questões");

                return Ok(detalhe);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao buscar detalhe da execução {execucaoId} do usuário {userId}");
                return StatusCode(500, new { message = "Erro ao buscar detalhe da atividade", error = ex.Message });
            }
        }

        // POST: api/AtividadeIA/gerar
        [HttpPost("gerar")]
        public async Task<ActionResult<object>> GerarAtividade([FromBody] GerarAtividadeRequestNovo request)
        {
            var requisicaoInicio = DateTime.UtcNow;
            try
            {
                var atividade = await GerarAtividadeProcessoAsync(request);
                return Ok(atividade);
            }
            catch (TimeoutException ex)
            {
                _logger.LogWarning(ex, "Timeout ao gerar atividade IA");
                await GarantirDuracaoMinimaAsync(requisicaoInicio, TimeSpan.FromMinutes(2));
                return StatusCode(StatusCodes.Status504GatewayTimeout, new { message = "Timeout ao gerar atividade IA", error = ex.Message });
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Resposta inválida da IA ao gerar atividade");
                await GarantirDuracaoMinimaAsync(requisicaoInicio, TimeSpan.FromMinutes(2));
                return StatusCode(StatusCodes.Status502BadGateway, new { message = "Resposta inválida da IA", error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar atividade IA");
                await GarantirDuracaoMinimaAsync(requisicaoInicio, TimeSpan.FromMinutes(2));
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Erro ao gerar atividade IA", error = ex.Message });
            }
        }

        // POST: api/AtividadeIA/gerar-stream
        [HttpPost("gerar-stream")]
        public async Task GerarAtividadeStream([FromBody] GerarAtividadeRequestNovo request)
        {
            var requisicaoInicio = DateTime.UtcNow;
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

            await EnviarEventoAsync(new { type = "progress", percent = 5, message = "Iniciando geração..." });

            try
            {
                var atividade = await GerarAtividadeProcessoAsync(
                    request,
                    async (percent, message) => await EnviarEventoAsync(new { type = "progress", percent, message })
                );

                await EnviarEventoAsync(new { type = "completed", percent = 100, message = "Atividade pronta!", atividade });
            }
            catch (TimeoutException ex)
            {
                _logger.LogWarning(ex, "Timeout na geração IA (stream)");
                await GarantirDuracaoMinimaAsync(requisicaoInicio, TimeSpan.FromMinutes(2));
                await EnviarEventoAsync(new { type = "error", message = "Timeout ao gerar atividade IA: " + ex.Message });
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Resposta inválida da IA (stream)");
                await GarantirDuracaoMinimaAsync(requisicaoInicio, TimeSpan.FromMinutes(2));
                await EnviarEventoAsync(new { type = "error", message = "Resposta inválida da IA: " + ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado na geração IA (stream)");
                await GarantirDuracaoMinimaAsync(requisicaoInicio, TimeSpan.FromMinutes(2));
                await EnviarEventoAsync(new { type = "error", message = "Erro ao gerar atividade IA: " + ex.Message });
            }
        }

        private async Task<object> GerarAtividadeProcessoAsync(
            GerarAtividadeRequestNovo request,
            Func<int, string, Task>? onProgress = null)
        {
            string? respostaIA = null;
            var inicio = DateTime.UtcNow;
            var quantidade = request.Configuracao?.Quantidade ?? 10;

            async Task Report(int percent, string message)
            {
                if (onProgress != null)
                {
                    await onProgress(percent, message);
                }
            }

            try
            {
                _logger.LogInformation($"Gerando atividade IA: Matéria={request.Configuracao?.Materia}, Nível={request.Configuracao?.Nivel}, Quantidade={quantidade}");
                await Report(10, "Preparando solicitação...");

                var modoRapido = quantidade >= 10;

                var tokensPorQuestao = (request.Configuracao?.Explicacao ?? false) ? 150 : 110;
                var maxTokensParaRequisicao = Math.Clamp(quantidade * tokensPorQuestao + 300, 800, 2600);

                var explicacaoCurta = quantidade >= 10
                    ? "Explicação curta (máx. 120 caracteres por questão)."
                    : "Explicação breve e objetiva por questão.";

                var contextoConcurso = string.Empty;
                if (string.Equals(request.Configuracao?.Segmento, "Concurso", StringComparison.OrdinalIgnoreCase)
                    && !string.IsNullOrWhiteSpace(request.Configuracao?.Concurso))
                {
                    contextoConcurso = $@"
- Concurso alvo: {request.Configuracao?.Concurso}
- As questões devem seguir o padrão de cobrança e estilo desse concurso (nível, linguagem e perfil de banca).";
                }

                var prompt = $@"Gere {quantidade} questões de múltipla escolha sobre {request.Configuracao?.Conteudo} para {request.Configuracao?.Materia}.

CONFIGURAÇÃO:
- Público: Alunos do {request.Configuracao?.Ano} - {request.Configuracao?.Segmento}
- Nível de dificuldade: {request.Configuracao?.Nivel}
- Quantidade: {quantidade} questões
{contextoConcurso}

REGRAS OBRIGATÓRIAS:
1. Cada questão deve ter exatamente 4 alternativas (A, B, C, D)
2. Apenas UMA alternativa correta por questão
3. As alternativas incorretas devem ser plausíveis
4. Linguagem adequada ao nível escolar ({request.Configuracao?.Ano})
5. Enunciados claros e objetivos
6. Contextualize com situações do cotidiano
7. Mantenha enunciados curtos (máx. 180 caracteres)
8. Mantenha alternativas curtas (máx. 90 caracteres)

FORMATO DE SAÍDA (JSON VÁLIDO):
{{
  ""questoes"": [
    {{
      ""numero"": 1,
      ""enunciado"": ""[TEXTO DA QUESTÃO]"",
      ""alternativas"": [
        {{""id"": ""A"", ""texto"": ""[ALTERNATIVA A]""}},
        {{""id"": ""B"", ""texto"": ""[ALTERNATIVA B]""}},
        {{""id"": ""C"", ""texto"": ""[ALTERNATIVA C]""}},
        {{""id"": ""D"", ""texto"": ""[ALTERNATIVA D]""}}
      ]
    }}
  ],
  ""gabarito"": [
    {{""questao"": 1, ""respostaCorreta"": ""A""}}
  ]{(modoRapido ? string.Empty : ",\n  \"explicacoes\": [\n    {\"questao\": 1, \"explicacao\": \"[EXPLICAÇÃO CURTA DA RESPOSTA CORRETA]\"}\n  ]")}
}}

OBSERVAÇÃO SOBRE EXPLICAÇÕES:
- {(modoRapido ? "No modo rápido, NÃO envie o bloco explicacoes." : explicacaoCurta)}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional antes ou depois.";

                await Report(25, "Enviando para IA...");

                // Criar CancellationTokenSource para cancelar a chamada se exceder o tempo limite
                var timeoutSeconds = 180;
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(timeoutSeconds));
                var tarefaGeracao = _deepSeekService.GerarAtividadeAsync(prompt, maxTokensParaRequisicao, cts.Token);

                var progressoTimer = Task.Run(async () =>
                {
                    var percentual = 35;
                    while (!tarefaGeracao.IsCompleted && percentual < 90)
                    {
                        await Task.Delay(TimeSpan.FromSeconds(2));
                        if (tarefaGeracao.IsCompleted)
                        {
                            break;
                        }

                        await Report(percentual, "Gerando questões...");
                        percentual += 10;
                    }
                });

                var tarefaConcluida = await Task.WhenAny(tarefaGeracao, Task.Delay(TimeSpan.FromSeconds(timeoutSeconds)));

                if (tarefaConcluida != tarefaGeracao)
                {
                    // Cancela explicitamente a requisição pendente para evitar trabalho em segundo plano
                    try { cts.Cancel(); } catch {}
                    _logger.LogWarning("Timeout ao gerar atividade IA após {Timeout}s. Matéria={Materia}, Quantidade={Quantidade}", timeoutSeconds, request.Configuracao?.Materia, quantidade);
                    await Report(95, $"Tempo limite ({timeoutSeconds}s) atingido ao consultar a IA.");
                    throw new TimeoutException($"Timeout ao gerar atividade IA para Matéria={request.Configuracao?.Materia}, Quantidade={quantidade}");
                }

                await progressoTimer;
                respostaIA = await tarefaGeracao;

                await Report(92, "Processando resposta...");

                _logger.LogInformation($"Resposta bruta do DeepSeek (primeiros 500 caracteres): {respostaIA.Substring(0, Math.Min(500, respostaIA.Length))}");

                respostaIA = respostaIA.Trim();

                if (respostaIA.StartsWith("```json"))
                {
                    respostaIA = respostaIA.Substring(7);
                }
                else if (respostaIA.StartsWith("```"))
                {
                    respostaIA = respostaIA.Substring(3);
                }

                if (respostaIA.EndsWith("```"))
                {
                    respostaIA = respostaIA.Substring(0, respostaIA.Length - 3);
                }

                respostaIA = respostaIA.Trim();

                int startIndex = respostaIA.IndexOf('{');
                int endIndex = respostaIA.LastIndexOf('}');

                if (startIndex >= 0 && endIndex > startIndex)
                {
                    respostaIA = respostaIA.Substring(startIndex, endIndex - startIndex + 1);
                }

                _logger.LogInformation($"JSON limpo (primeiros 500 caracteres): {respostaIA.Substring(0, Math.Min(500, respostaIA.Length))}");

                JsonSerializerOptions options = new JsonSerializerOptions
                {
                    AllowTrailingCommas = true,
                    ReadCommentHandling = JsonCommentHandling.Skip,
                    PropertyNameCaseInsensitive = true
                };

                var atividadeGerada = JsonSerializer.Deserialize<JsonElement>(respostaIA, options);

                var explicacoes = new List<object>();
                if (atividadeGerada.TryGetProperty("explicacoes", out var explicacoesJson) && explicacoesJson.ValueKind == JsonValueKind.Array)
                {
                    explicacoes = explicacoesJson.EnumerateArray().Select(e => (object)new
                    {
                        questao = e.TryGetProperty("questao", out var qProp) ? qProp.GetInt32() : 0,
                        explicacao = e.TryGetProperty("explicacao", out var exProp) ? exProp.GetString() : ""
                    }).ToList();
                }

                var random = new Random();

                var gabaritoOriginal = new Dictionary<int, string>();
                foreach (var g in atividadeGerada.GetProperty("gabarito").EnumerateArray())
                {
                    var questaoNumero = g.TryGetProperty("questao", out var questaoProp) && questaoProp.ValueKind == JsonValueKind.Number
                        ? questaoProp.GetInt32()
                        : 0;

                    var resposta = g.TryGetProperty("respostaCorreta", out var respProp)
                        ? respProp.GetString()
                        : null;

                    if (questaoNumero <= 0 || string.IsNullOrWhiteSpace(resposta))
                    {
                        continue;
                    }

                    gabaritoOriginal[questaoNumero] = resposta.Trim().ToUpperInvariant();
                }

                var questoesJson = atividadeGerada.GetProperty("questoes").EnumerateArray().ToList();
                var questoesProcessadas = new List<object>();
                var gabaritoProcessado = new List<object>();

                for (int index = 0; index < questoesJson.Count; index++)
                {
                    var questaoJson = questoesJson[index];
                    var numeroQuestao = index + 1;

                    var alternativasOriginais = questaoJson.GetProperty("alternativas")
                        .EnumerateArray()
                        .Select((a, altIndex) =>
                        {
                            var fallbackLetra = ((char)('A' + altIndex)).ToString();
                            var idOriginal = a.TryGetProperty("id", out var idProp)
                                ? idProp.GetString()
                                : null;

                            return new
                            {
                                letra = string.IsNullOrWhiteSpace(idOriginal)
                                    ? fallbackLetra
                                    : idOriginal.Trim().ToUpperInvariant(),
                                texto = a.TryGetProperty("texto", out var textoProp)
                                    ? textoProp.GetString() ?? string.Empty
                                    : string.Empty
                            };
                        })
                        .ToList();

                    if (alternativasOriginais.Count == 0)
                    {
                        continue;
                    }

                    var letrasDestino = Enumerable.Range(0, alternativasOriginais.Count)
                        .Select(i => ((char)('A' + i)).ToString())
                        .ToArray();

                    var letraCorretaOriginal = gabaritoOriginal.TryGetValue(numeroQuestao, out var letraEncontrada)
                        ? letraEncontrada
                        : alternativasOriginais[0].letra;

                    var ordemAleatoria = Enumerable.Range(0, alternativasOriginais.Count)
                        .OrderBy(_ => random.Next())
                        .ToList();

                    var alternativasNormalizadas = new List<object>();
                    var novaLetraCorreta = letrasDestino[0];

                    for (int destino = 0; destino < ordemAleatoria.Count; destino++)
                    {
                        var indiceOriginal = ordemAleatoria[destino];
                        var alternativa = alternativasOriginais[indiceOriginal];
                        var letraDestino = letrasDestino[destino];

                        alternativasNormalizadas.Add(new
                        {
                            id = letraDestino,
                            texto = alternativa.texto
                        });

                        if (string.Equals(alternativa.letra, letraCorretaOriginal, StringComparison.OrdinalIgnoreCase))
                        {
                            novaLetraCorreta = letraDestino;
                        }
                    }

                    questoesProcessadas.Add(new
                    {
                        numero = numeroQuestao,
                        enunciado = questaoJson.GetProperty("enunciado").GetString(),
                        alternativas = alternativasNormalizadas.ToArray(),
                        tipo = "MultiplaEscolha"
                    });

                    gabaritoProcessado.Add(new
                    {
                        questao = numeroQuestao,
                        respostaCorreta = novaLetraCorreta
                    });
                }

                var atividade = new
                {
                    id = Guid.NewGuid().ToString(),
                    configuracao = request.Configuracao,
                    questoes = questoesProcessadas.ToArray(),
                    gabarito = gabaritoProcessado.ToArray(),
                    explicacoes,
                    criadaEm = DateTime.UtcNow
                };

                var tempoTotal = DateTime.UtcNow - inicio;
                _logger.LogInformation("Atividade IA gerada com sucesso com {Quantidade} questões em {TempoMs}ms", quantidade, (int)tempoTotal.TotalMilliseconds);
                await Report(100, "Atividade pronta!");

                return atividade;
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogWarning(ex, "Timeout/cancelamento na geração IA.");
                await Report(95, "Timeout na IA ao gerar atividade.");
                throw new TimeoutException("Geração de atividade IA foi cancelada/timeout.", ex);
            }
            catch (TimeoutException ex)
            {
                _logger.LogWarning(ex, "Timeout na geração IA.");
                await Report(95, "Timeout na IA ao gerar atividade.");
                throw;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, $"Erro ao parsear JSON da resposta do DeepSeek. JSON recebido: {respostaIA}");
                await Report(95, "Resposta inválida da IA ao gerar atividade.");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao gerar atividade IA");
                await Report(95, "Erro inesperado na geração IA.");
                throw;
            }
        }
        

        // POST: api/AtividadeIA/corrigir
        [HttpPost("corrigir")]
        public async Task<ActionResult<object>> CorrigirAtividade([FromBody] CorrigirAtividadeRequest request)
        {
            try
            {
                _logger.LogInformation($"Corrigindo atividade para usuário {request.UserId}");

                if (request.UserId <= 0)
                {
                    return BadRequest(new { message = "Usuário inválido para correção da atividade." });
                }

                var usuarioExiste = await _context.Users.AnyAsync(u => u.Id == request.UserId);
                if (!usuarioExiste)
                {
                    return BadRequest(new { message = "Usuário não encontrado para salvar a correção." });
                }

                // Calcular acertos e erros
                int acertos = 0;
                int erros = 0;
                var resultados = new List<object>();

                if (request.Gabarito != null && request.Respostas != null)
                {
                    _logger.LogInformation($"📝 Corrigindo {request.Respostas.Count} respostas contra {request.Gabarito.Count} itens do gabarito");
                    
                    foreach (var resposta in request.Respostas)
                    {
                        var gabaritoQuestao = request.Gabarito.FirstOrDefault(g => g.Questao == resposta.Questao);
                        bool acertou = false;

                        if (gabaritoQuestao != null)
                        {
                            // Comparação case-insensitive para múltipla escolha
                            acertou = string.Equals(
                                resposta.Resposta?.Trim(), 
                                gabaritoQuestao.RespostaCorreta?.Trim(), 
                                StringComparison.OrdinalIgnoreCase
                            );
                            
                            _logger.LogInformation($"Questão {resposta.Questao}: Aluno='{resposta.Resposta}' vs Gabarito='{gabaritoQuestao.RespostaCorreta}' → {(acertou ? "✅ ACERTOU" : "❌ ERROU")}");

                            if (acertou)
                                acertos++;
                            else
                                erros++;

                            resultados.Add(new
                            {
                                questao = resposta.Questao,
                                respostaAluno = resposta.Resposta,
                                respostaCorreta = gabaritoQuestao.RespostaCorreta,
                                acertou = acertou,
                                explicacao = gabaritoQuestao.Explicacao
                            });
                        }
                    }
                }

                // Calcular nota
                int totalQuestoes = request.Respostas?.Count ?? 0;
                decimal nota = totalQuestoes > 0 ? (decimal)acertos / totalQuestoes * 10 : 0;
                decimal percentual = totalQuestoes > 0 ? (decimal)acertos / totalQuestoes * 100 : 0;
                
                _logger.LogInformation($"📊 CÁLCULO DE NOTA: {acertos} acertos / {totalQuestoes} questões = {nota:F2} (percentual: {percentual:F2}%)");

                var atividadeFkId = 0;
                if (int.TryParse(request.AtividadeId, out var atividadeIdParseado) && atividadeIdParseado > 0)
                {
                    var atividadeExiste = await _context.Atividades.AnyAsync(a => a.Id == atividadeIdParseado);
                    if (atividadeExiste)
                    {
                        atividadeFkId = atividadeIdParseado;
                    }
                }

                if (atividadeFkId <= 0)
                {
                    atividadeFkId = await ObterOuCriarAtividadeTecnicaIaAsync(request.Configuracao, totalQuestoes);
                }

                // Salvar no banco de dados
                var execucao = new AtividadeExecucoes
                {
                    UserId = request.UserId,
                    AtividadeId = atividadeFkId,
                    TotalQuestoes = totalQuestoes,
                    GeradaPorIA = true,
                    Status = "Concluída",
                    DataInicio = DateTime.UtcNow.AddMinutes(-15), // Estimativa
                    DataFim = DateTime.UtcNow,
                    Acertos = acertos,
                    Erros = erros,
                    Nota = nota,
                    TempoGastoSegundos = 900, // 15 minutos default
                    Materia = LimitarTexto(request.Configuracao?.Materia, 100),
                    Segmento = LimitarTexto(request.Configuracao?.Segmento, 50),
                    Ano = LimitarTexto(request.Configuracao?.Ano, 50),
                    Conteudo = LimitarTexto(request.Configuracao?.Conteudo, 500),
                    Nivel = LimitarTexto(request.Configuracao?.Nivel, 50),
                    Tipo = LimitarTexto(request.Configuracao?.Tipo, 50),
                    QuestoesJson = request.Questoes != null ? JsonSerializer.Serialize(request.Questoes) : null,
                    GabaritoJson = request.Gabarito != null ? JsonSerializer.Serialize(request.Gabarito) : null,
                    RespostasJson = request.Respostas != null ? JsonSerializer.Serialize(request.Respostas) : null,
                    CriadoEm = DateTime.UtcNow,
                    AtualizadoEm = DateTime.UtcNow
                };

                _context.AtividadeExecucoes.Add(execucao);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Atividade salva com sucesso. ID: {execucao.Id}, Nota: {nota}, Acertos: {acertos}/{totalQuestoes}");

                var resultado = new
                {
                    atividadeId = request.AtividadeId,
                    execucaoId = execucao.Id,
                    totalQuestoes = totalQuestoes,
                    acertos = acertos,
                    erros = erros,
                    nota = nota,
                    percentual = percentual,
                    resultados = resultados
                };

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao corrigir atividade");
                return StatusCode(500, new { message = "Erro ao corrigir atividade", error = ex.Message });
            }
        }

        private static async Task GarantirDuracaoMinimaAsync(DateTime inicio, TimeSpan duracaoMinima)
        {
            var restante = duracaoMinima - (DateTime.UtcNow - inicio);
            if (restante > TimeSpan.Zero)
            {
                await Task.Delay(restante);
            }
        }

        private static string? LimitarTexto(string? valor, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(valor))
            {
                return valor;
            }

            return valor.Length <= maxLength ? valor : valor[..maxLength];
        }

        private async Task<int> ObterOuCriarAtividadeTecnicaIaAsync(ConfiguracaoAtividadeDto? configuracao, int totalQuestoes)
        {
            var nomeMateria = LimitarTexto(configuracao?.Materia, 100);

            int? materiaId = null;
            if (!string.IsNullOrWhiteSpace(nomeMateria))
            {
                var nomeMateriaLower = nomeMateria.ToLower();
                materiaId = await _context.materias
                    .Where(m => m.Nome.ToLower() == nomeMateriaLower)
                    .Select(m => (int?)m.Id)
                    .FirstOrDefaultAsync();
            }

            if (!materiaId.HasValue)
            {
                materiaId = await _context.materias
                    .Select(m => (int?)m.Id)
                    .FirstOrDefaultAsync();
            }

            if (!materiaId.HasValue)
            {
                var novaMateria = new Materias
                {
                    Nome = nomeMateria ?? "Geral",
                    area_id = 0
                };

                _context.materias.Add(novaMateria);
                await _context.SaveChangesAsync();
                materiaId = novaMateria.Id;
            }

            var nomeAtividadeTecnica = "Atividade IA - Execução";
            var tipoAtividade = LimitarTexto(configuracao?.Tipo, 50) ?? "Quiz";
            var nivelAtividade = LimitarTexto(configuracao?.Nivel, 50) ?? "Médio";

            var atividadeTecnica = await _context.Atividades
                .Where(a => a.MateriaId == materiaId.Value && a.Nome == nomeAtividadeTecnica && a.Tipo == tipoAtividade)
                .FirstOrDefaultAsync();

            if (atividadeTecnica == null)
            {
                atividadeTecnica = new Atividades
                {
                    Nome = nomeAtividadeTecnica,
                    Descricao = "Atividade técnica criada automaticamente para persistir execuções geradas por IA.",
                    MateriaId = materiaId.Value,
                    Tipo = tipoAtividade,
                    NivelDificuldade = nivelAtividade,
                    TotalQuestoes = totalQuestoes > 0 ? totalQuestoes : Math.Max(1, configuracao?.Quantidade ?? 10),
                    Ativo = true,
                    CriadoEm = DateTime.UtcNow,
                    AtualizadoEm = DateTime.UtcNow
                };

                _context.Atividades.Add(atividadeTecnica);
                await _context.SaveChangesAsync();
            }

            return atividadeTecnica.Id;
        }
    }

    // DTOs
    public class GerarAtividadeRequest
    {
        public string Materia { get; set; } = "";
        public string Dificuldade { get; set; } = "";
        public int QuantidadeQuestoes { get; set; }
        public string? Topico { get; set; }
    }

    public class GerarAtividadeRequestNovo
    {
        public ConfiguracaoAtividadeDto? Configuracao { get; set; }
        public string? Prompt { get; set; }
    }

    public class CorrigirAtividadeRequest
    {
        public string AtividadeId { get; set; } = "";
        public int UserId { get; set; }
        public ConfiguracaoAtividadeDto? Configuracao { get; set; }
        public List<object>? Questoes { get; set; }
        public List<GabaritoDto>? Gabarito { get; set; }
        public List<RespostaAlunoDto>? Respostas { get; set; }
    }

    public class ConfiguracaoAtividadeDto
    {
        public string? Materia { get; set; }
        public string? Segmento { get; set; }
        public string? Concurso { get; set; }
        public string? Ano { get; set; }
        public string? Conteudo { get; set; }
        public string? Nivel { get; set; }
        public string? Tipo { get; set; }
        public int Quantidade { get; set; }
        public bool Explicacao { get; set; }
    }

    public class GabaritoDto
    {
        public int Questao { get; set; }
        public string RespostaCorreta { get; set; } = "";
        public string Explicacao { get; set; } = "";
    }

    public class RespostaAlunoDto
    {
        public int Questao { get; set; }
        public string Resposta { get; set; } = "";
    }

    public class RespostaQuestao
    {
        public int Numero { get; set; }
        public string Resposta { get; set; } = "";
    }
}
