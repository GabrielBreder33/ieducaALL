using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.Models;
using System.Text;
using System.Text.Json;
using System.Net.Http.Headers;

namespace ServiceIEDUCA.Services
{
    public class RedacaoCorrecaoService : IRedacaoCorrecaoService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<RedacaoCorrecaoService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public RedacaoCorrecaoService(
            AppDbContext context,
            ILogger<RedacaoCorrecaoService> logger,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public async Task<RedacaoCorrecoes> IniciarCorrecaoAsync(
            int userId,
            int? atividadeExecucaoId,
            string tema,
            string textoRedacao,
            string tipoAvaliacao)
        {
            var correcao = new RedacaoCorrecoes
            {
                UserId = userId,
                AtividadeExecucaoId = atividadeExecucaoId,
                Tema = tema,
                TextoRedacao = textoRedacao,
                NotaZero = false,
                NotaTotal = 0,
                ResumoFinal = "Processando correção...",
                ConfiancaAvaliacao = 0,
                Status = "Processando",
                Progresso = 0,
                TipoAvaliacao = tipoAvaliacao ?? "ENEM",
                CriadoEm = DateTime.Now
            };

            _context.RedacaoCorrecoes.Add(correcao);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Correção iniciada: ID={correcao.Id}");

            // Iniciar processamento em background
            _ = Task.Run(async () => await ProcessarCorrecaoAsync(correcao.Id));

            return correcao;
        }

        public async Task ProcessarCorrecaoAsync(int correcaoId)
        {
            try
            {
                _logger.LogInformation($"Iniciando processamento da correção {correcaoId}");

                var correcao = await _context.RedacaoCorrecoes
                    .FirstOrDefaultAsync(c => c.Id == correcaoId);

                if (correcao == null)
                {
                    _logger.LogError($"Correção {correcaoId} não encontrada");
                    return;
                }

                // Atualizar progresso: Iniciando
                await AtualizarProgressoAsync(correcaoId, 10, "Analisando texto");

                // Chamar a API DeepSeek para correção
                var resultadoCorrecao = await ChamarDeepSeekAPIAsync(correcao);

                if (resultadoCorrecao == null)
                {
                    await AtualizarProgressoAsync(correcaoId, 0, "Erro na correção");
                    return;
                }

                // Atualizar progresso: Processando resposta
                await AtualizarProgressoAsync(correcaoId, 50, "Processando análise");

                // Salvar resultados no banco
                await SalvarResultadosAsync(correcaoId, resultadoCorrecao);

                // Atualizar progresso: Concluído
                await AtualizarProgressoAsync(correcaoId, 100, "Concluída");

                _logger.LogInformation($"Correção {correcaoId} concluída com sucesso");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao processar correção {correcaoId}");
                await AtualizarProgressoAsync(correcaoId, 0, "Erro");
            }
        }

        private async Task<CorrecaoResultado?> ChamarDeepSeekAPIAsync(RedacaoCorrecoes correcao)
        {
            try
            {
                var apiKey = _configuration["DeepSeek:ApiKey"] ?? "";
                var apiUrl = _configuration["DeepSeek:ApiUrl"] ?? "https://api.deepseek.com/v1/chat/completions";

                if (string.IsNullOrEmpty(apiKey))
                {
                    _logger.LogError("API Key do DeepSeek não configurada");
                    return null;
                }

                var prompt = GerarPromptCorrecao(correcao);

                var requestBody = new
                {
                    model = "deepseek-chat",
                    messages = new[]
                    {
                        new { role = "system", content = "Você é um corretor especializado em redações do ENEM. Analise a redação seguindo rigorosamente os critérios das 5 competências do ENEM e retorne um JSON estruturado com a correção completa." },
                        new { role = "user", content = prompt }
                    },
                    temperature = 0.3,
                    max_tokens = 4000,
                    response_format = new { type = "json_object" }
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

                var response = await _httpClient.PostAsync(apiUrl, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Erro na API DeepSeek: {response.StatusCode} - {responseContent}");
                    return null;
                }

                var apiResponse = JsonSerializer.Deserialize<DeepSeekResponse>(responseContent);
                var messageContent = apiResponse?.choices?[0]?.message?.content;

                if (string.IsNullOrEmpty(messageContent))
                {
                    _logger.LogError("Resposta vazia da API DeepSeek");
                    return null;
                }

                // Parse do JSON retornado
                var resultado = JsonSerializer.Deserialize<CorrecaoResultado>(messageContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return resultado;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao chamar API DeepSeek");
                return null;
            }
        }

        private string GerarPromptCorrecao(RedacaoCorrecoes correcao)
        {
            return $@"Corrija a seguinte redação do ENEM sobre o tema: ""{correcao.Tema}""

TEXTO DA REDAÇÃO:
{correcao.TextoRedacao}

INSTRUÇÕES:
Analise a redação segundo as 5 competências do ENEM:
1. Domínio da modalidade escrita formal da língua portuguesa (0-200 pontos)
2. Compreender o tema e aplicar conceitos de várias áreas do conhecimento (0-200 pontos)
3. Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos (0-200 pontos)
4. Conhecimento dos mecanismos linguísticos para construção da argumentação (0-200 pontos)
5. Proposta de intervenção que respeite os direitos humanos (0-200 pontos)

IMPORTANTE: Se a redação fugir completamente do tema, ferir direitos humanos, tiver menos de 7 linhas, for cópia de texto motivador ou parte significativa for ilegível, atribua nota ZERO.

Retorne APENAS um JSON válido com a seguinte estrutura:
{{
  ""notaZero"": false,
  ""motivoNotaZero"": null,
  ""competencias"": [
    {{
      ""numeroCompetencia"": 1,
      ""nomeCompetencia"": ""Domínio da norma culta"",
      ""nota"": 160,
      ""comentario"": ""Comentário detalhado sobre a competência"",
      ""evidencias"": [""Trechos que demonstram o domínio""],
      ""melhorias"": [""Sugestões específicas de melhoria""]
    }}
  ],
  ""errosGramaticais"": [
    {{
      ""posicaoInicio"": 15,
      ""posicaoFim"": 25,
      ""textoOriginal"": ""Texto com erro"",
      ""textoSugerido"": ""Texto corrigido"",
      ""explicacao"": ""Explicação do erro"",
      ""severidade"": ""alta""
    }}
  ],
  ""feedbacks"": {{
    ""pontosPositivos"": [""Ponto positivo 1"", ""Ponto positivo 2""],
    ""pontosMelhoria"": [""Ponto de melhoria 1""],
    ""recomendacoes"": [""Recomendação 1""]
  }},
  ""propostaIntervencao"": {{
    ""avaliacao"": ""Análise da proposta de intervenção"",
    ""sugestoesConcretas"": [""Sugestão 1"", ""Sugestão 2""]
  }},
  ""resumoFinal"": ""Resumo geral da correção"",
  ""versaoReescrita"": ""Versão reescrita e melhorada da redação"",
  ""confiancaAvaliacao"": 92.5
}}";
        }

        private async Task SalvarResultadosAsync(int correcaoId, CorrecaoResultado resultado)
        {
            var correcao = await _context.RedacaoCorrecoes
                .Include(c => c.Competencias)
                .Include(c => c.ErrosGramaticais)
                .Include(c => c.Feedbacks)
                .Include(c => c.PropostaIntervencao)
                .FirstOrDefaultAsync(c => c.Id == correcaoId);

            if (correcao == null) return;

            // Limpar dados anteriores se existirem
            if (correcao.Competencias != null && correcao.Competencias.Any())
                _context.RedacaoCompetencias.RemoveRange(correcao.Competencias);
            if (correcao.ErrosGramaticais != null && correcao.ErrosGramaticais.Any())
                _context.RedacaoErrosGramaticais.RemoveRange(correcao.ErrosGramaticais);
            if (correcao.Feedbacks != null && correcao.Feedbacks.Any())
                _context.RedacaoFeedbacks.RemoveRange(correcao.Feedbacks);
            if (correcao.PropostaIntervencao != null)
                _context.RedacaoPropostaIntervencao.Remove(correcao.PropostaIntervencao);

            // Atualizar correção principal
            correcao.NotaZero = resultado.NotaZero;
            correcao.MotivoNotaZero = resultado.MotivoNotaZero;
            correcao.NotaTotal = resultado.Competencias?.Sum(c => c.Nota) ?? 0;
            correcao.ResumoFinal = resultado.ResumoFinal;
            correcao.VersaoReescrita = resultado.VersaoReescrita;
            correcao.ConfiancaAvaliacao = resultado.ConfiancaAvaliacao;
            correcao.AtualizadoEm = DateTime.Now;

            // Salvar competências
            if (resultado.Competencias != null)
            {
                foreach (var comp in resultado.Competencias)
                {
                    var competencia = new RedacaoCompetencias
                    {
                        RedacaoCorrecaoId = correcaoId,
                        NumeroCompetencia = comp.NumeroCompetencia,
                        NomeCompetencia = comp.NomeCompetencia,
                        Nota = comp.Nota,
                        Comentario = comp.Comentario,
                        Evidencias = comp.Evidencias != null ? JsonSerializer.Serialize(comp.Evidencias) : null,
                        Melhorias = comp.Melhorias != null ? JsonSerializer.Serialize(comp.Melhorias) : null
                    };
                    _context.RedacaoCompetencias.Add(competencia);
                }
            }

            // Salvar erros gramaticais
            if (resultado.ErrosGramaticais != null)
            {
                foreach (var erro in resultado.ErrosGramaticais)
                {
                    var erroDb = new RedacaoErrosGramaticais
                    {
                        RedacaoCorrecaoId = correcaoId,
                        PosicaoInicio = erro.PosicaoInicio,
                        PosicaoFim = erro.PosicaoFim,
                        TextoOriginal = erro.TextoOriginal,
                        TextoSugerido = erro.TextoSugerido,
                        Explicacao = erro.Explicacao,
                        Severidade = erro.Severidade
                    };
                    _context.RedacaoErrosGramaticais.Add(erroDb);
                }
            }

            // Salvar feedbacks
            if (resultado.Feedbacks != null)
            {
                int ordem = 0;
                if (resultado.Feedbacks.PontosPositivos != null)
                {
                    foreach (var feedback in resultado.Feedbacks.PontosPositivos)
                    {
                        _context.RedacaoFeedbacks.Add(new RedacaoFeedbacks
                        {
                            RedacaoCorrecaoId = correcaoId,
                            Tipo = "positive",
                            Conteudo = feedback,
                            Ordem = ordem++
                        });
                    }
                }

                if (resultado.Feedbacks.PontosMelhoria != null)
                {
                    ordem = 0;
                    foreach (var feedback in resultado.Feedbacks.PontosMelhoria)
                    {
                        _context.RedacaoFeedbacks.Add(new RedacaoFeedbacks
                        {
                            RedacaoCorrecaoId = correcaoId,
                            Tipo = "negative",
                            Conteudo = feedback,
                            Ordem = ordem++
                        });
                    }
                }

                if (resultado.Feedbacks.Recomendacoes != null)
                {
                    ordem = 0;
                    foreach (var feedback in resultado.Feedbacks.Recomendacoes)
                    {
                        _context.RedacaoFeedbacks.Add(new RedacaoFeedbacks
                        {
                            RedacaoCorrecaoId = correcaoId,
                            Tipo = "recommendation",
                            Conteudo = feedback,
                            Ordem = ordem++
                        });
                    }
                }
            }

            // Salvar proposta de intervenção
            if (resultado.PropostaIntervencao != null)
            {
                var proposta = new RedacaoPropostaIntervencao
                {
                    RedacaoCorrecaoId = correcaoId,
                    Avaliacao = resultado.PropostaIntervencao.Avaliacao,
                    SugestoesConcretas = resultado.PropostaIntervencao.SugestoesConcretas != null
                        ? JsonSerializer.Serialize(resultado.PropostaIntervencao.SugestoesConcretas)
                        : null
                };
                _context.RedacaoPropostaIntervencao.Add(proposta);
            }

            await _context.SaveChangesAsync();
        }

        public async Task AtualizarProgressoAsync(int correcaoId, int progresso, string status)
        {
            var correcao = await _context.RedacaoCorrecoes.FindAsync(correcaoId);
            if (correcao != null)
            {
                correcao.Progresso = progresso;
                correcao.Status = status;
                correcao.AtualizadoEm = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<RedacaoCorrecoes?> ObterCorrecaoAsync(int correcaoId)
        {
            return await _context.RedacaoCorrecoes
                .Include(c => c.Competencias)
                .Include(c => c.ErrosGramaticais)
                .Include(c => c.Feedbacks)
                .Include(c => c.PropostaIntervencao)
                .FirstOrDefaultAsync(c => c.Id == correcaoId);
        }

        public async Task<List<RedacaoCorrecoes>> ObterCorrecoesUsuarioAsync(int userId)
        {
            return await _context.RedacaoCorrecoes
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.CriadoEm)
                .ToListAsync();
        }
    }

    // Classes de suporte
    public class CorrecaoResultado
    {
        public bool NotaZero { get; set; }
        public string? MotivoNotaZero { get; set; }
        public List<CompetenciaResultado>? Competencias { get; set; }
        public List<ErroGramaticalResultado>? ErrosGramaticais { get; set; }
        public FeedbacksResultado? Feedbacks { get; set; }
        public PropostaIntervencaoResultado? PropostaIntervencao { get; set; }
        public string? ResumoFinal { get; set; }
        public string? VersaoReescrita { get; set; }
        public decimal ConfiancaAvaliacao { get; set; }
    }

    public class CompetenciaResultado
    {
        public int NumeroCompetencia { get; set; }
        public string NomeCompetencia { get; set; } = string.Empty;
        public int Nota { get; set; }
        public string? Comentario { get; set; }
        public List<string>? Evidencias { get; set; }
        public List<string>? Melhorias { get; set; }
    }

    public class ErroGramaticalResultado
    {
        public int PosicaoInicio { get; set; }
        public int PosicaoFim { get; set; }
        public string? TextoOriginal { get; set; }
        public string? TextoSugerido { get; set; }
        public string? Explicacao { get; set; }
        public string? Severidade { get; set; }
    }

    public class FeedbacksResultado
    {
        public List<string>? PontosPositivos { get; set; }
        public List<string>? PontosMelhoria { get; set; }
        public List<string>? Recomendacoes { get; set; }
    }

    public class PropostaIntervencaoResultado
    {
        public string? Avaliacao { get; set; }
        public List<string>? SugestoesConcretas { get; set; }
    }

    public class DeepSeekResponse
    {
        public List<DeepSeekChoice>? choices { get; set; }
    }

    public class DeepSeekChoice
    {
        public DeepSeekMessage? message { get; set; }
    }

    public class DeepSeekMessage
    {
        public string? content { get; set; }
    }
}
