using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Models;
using ServiceIEDUCA.Services;
using System.Text.Json;

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

                // Primeiro, contar TODAS as atividades IA do usuário
                var totalTodasAtividades = await _context.AtividadeExecucoes
                    .Where(e => e.UserId == userId && e.GeradaPorIA == true)
                    .CountAsync();
                    
                var totalConcluidas = await _context.AtividadeExecucoes
                    .Where(e => e.UserId == userId && e.GeradaPorIA == true && e.Status == "Concluída")
                    .CountAsync();
                    
                _logger.LogInformation($"📊 Usuário {userId}: {totalTodasAtividades} atividades IA no total, {totalConcluidas} concluídas");

                // Buscar todas as execuções de atividades IA do usuário
                var execucoes = await _context.AtividadeExecucoes
                    .Where(e => e.UserId == userId && e.GeradaPorIA == true && e.Status == "Concluída")
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
                    .Where(e => e.UserId == userId && e.Id == execucaoId && e.GeradaPorIA == true)
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
            string? respostaIA = null;
            try
            {
                _logger.LogInformation($"Gerando atividade IA: Matéria={request.Configuracao?.Materia}, Nível={request.Configuracao?.Nivel}, Quantidade={request.Configuracao?.Quantidade}");

                // Construir prompt detalhado para o DeepSeek
                var prompt = $@"Gere {request.Configuracao?.Quantidade} questões de múltipla escolha sobre {request.Configuracao?.Conteudo} para {request.Configuracao?.Materia}.

CONFIGURAÇÃO:
- Público: Alunos do {request.Configuracao?.Ano} - {request.Configuracao?.Segmento}
- Nível de dificuldade: {request.Configuracao?.Nivel}
- Quantidade: {request.Configuracao?.Quantidade} questões

REGRAS OBRIGATÓRIAS:
1. Cada questão deve ter exatamente 4 alternativas (A, B, C, D)
2. Apenas UMA alternativa correta por questão
3. As alternativas incorretas devem ser plausíveis
4. Linguagem adequada ao nível escolar ({request.Configuracao?.Ano})
5. Enunciados claros e objetivos
6. Contextualize com situações do cotidiano

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
  ],
  ""explicacoes"": [
    {{""questao"": 1, ""explicacao"": ""[EXPLICAÇÃO DETALHADA DA RESPOSTA CORRETA E POR QUE AS OUTRAS ESTÃO ERRADAS]""}}
  ]
}}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional antes ou depois.";

                // Chamar DeepSeek
                respostaIA = await _deepSeekService.GerarAtividadeAsync(prompt);
                
                _logger.LogInformation($"Resposta bruta do DeepSeek (primeiros 500 caracteres): {respostaIA.Substring(0, Math.Min(500, respostaIA.Length))}");
                
                // Limpar possíveis marcações de código e texto adicional
                respostaIA = respostaIA.Trim();
                
                // Remover blocos de código markdown
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
                
                // Tentar encontrar o JSON válido na resposta
                int startIndex = respostaIA.IndexOf('{');
                int endIndex = respostaIA.LastIndexOf('}');
                
                if (startIndex >= 0 && endIndex > startIndex)
                {
                    respostaIA = respostaIA.Substring(startIndex, endIndex - startIndex + 1);
                }
                
                _logger.LogInformation($"JSON limpo (primeiros 500 caracteres): {respostaIA.Substring(0, Math.Min(500, respostaIA.Length))}");

                // Parse do JSON retornado com opções mais flexíveis
                JsonSerializerOptions options = new JsonSerializerOptions
                {
                    AllowTrailingCommas = true,
                    ReadCommentHandling = JsonCommentHandling.Skip,
                    PropertyNameCaseInsensitive = true
                };
                
                var atividadeGerada = JsonSerializer.Deserialize<JsonElement>(respostaIA, options);
                
                var atividade = new
                {
                    id = Guid.NewGuid().ToString(),
                    configuracao = request.Configuracao,
                    questoes = atividadeGerada.GetProperty("questoes").EnumerateArray().Select((q, index) => new
                    {
                        numero = index + 1,
                        enunciado = q.GetProperty("enunciado").GetString(),
                        alternativas = q.GetProperty("alternativas").EnumerateArray().Select(a => new
                        {
                            id = a.GetProperty("id").GetString(),
                            texto = a.GetProperty("texto").GetString()
                        }).ToArray(),
                        tipo = "MultiplaEscolha"
                    }).ToArray(),
                    gabarito = atividadeGerada.GetProperty("gabarito").EnumerateArray().Select(g => new
                    {
                        questao = g.GetProperty("questao").GetInt32(),
                        respostaCorreta = g.GetProperty("respostaCorreta").GetString()
                    }).ToArray(),
                    explicacoes = atividadeGerada.GetProperty("explicacoes").EnumerateArray().Select(e => new
                    {
                        questao = e.GetProperty("questao").GetInt32(),
                        explicacao = e.GetProperty("explicacao").GetString()
                    }).ToArray(),
                    criadaEm = DateTime.Now
                };

                _logger.LogInformation($"Atividade IA gerada com sucesso com {request.Configuracao?.Quantidade} questões");

                return Ok(atividade);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, $"Erro ao parsear JSON da resposta do DeepSeek. JSON recebido: {respostaIA}");
                return StatusCode(500, new 
                { 
                    message = "Erro ao processar resposta da IA", 
                    error = ex.Message,
                    jsonRecebido = respostaIA?.Length > 1000 ? respostaIA.Substring(0, 1000) + "..." : respostaIA
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar atividade IA");
                return StatusCode(500, new { message = "Erro ao gerar atividade", error = ex.Message });
            }
        }

        // POST: api/AtividadeIA/corrigir
        [HttpPost("corrigir")]
        public async Task<ActionResult<object>> CorrigirAtividade([FromBody] CorrigirAtividadeRequest request)
        {
            try
            {
                _logger.LogInformation($"Corrigindo atividade para usuário {request.UserId}");

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

                // Salvar no banco de dados
                var execucao = new AtividadeExecucoes
                {
                    UserId = request.UserId,
                    AtividadeId = 0, // Atividade gerada por IA não tem ID específico
                    TotalQuestoes = totalQuestoes,
                    GeradaPorIA = true,
                    Status = "Concluída",
                    DataInicio = DateTime.Now.AddMinutes(-15), // Estimativa
                    DataFim = DateTime.Now,
                    Acertos = acertos,
                    Erros = erros,
                    Nota = nota,
                    TempoGastoSegundos = 900, // 15 minutos default
                    Materia = request.Configuracao?.Materia,
                    Segmento = request.Configuracao?.Segmento,
                    Ano = request.Configuracao?.Ano,
                    Conteudo = request.Configuracao?.Conteudo,
                    Nivel = request.Configuracao?.Nivel,
                    Tipo = request.Configuracao?.Tipo,
                    QuestoesJson = request.Questoes != null ? JsonSerializer.Serialize(request.Questoes) : null,
                    GabaritoJson = request.Gabarito != null ? JsonSerializer.Serialize(request.Gabarito) : null,
                    RespostasJson = request.Respostas != null ? JsonSerializer.Serialize(request.Respostas) : null,
                    CriadoEm = DateTime.Now,
                    AtualizadoEm = DateTime.Now
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
