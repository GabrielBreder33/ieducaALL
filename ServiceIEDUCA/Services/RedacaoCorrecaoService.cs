using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.Models;
using System.Text;
using System.Text.Json;
using System.Net.Http.Headers;
using System.Diagnostics;

namespace ServiceIEDUCA.Services
{
    public class RedacaoCorrecaoService : IRedacaoCorrecaoService
    {
        private const int TimeoutRequestSegundosPadrao = 45;
        private const int TimeoutLoteSegundosPadrao = 75;
        private const decimal PricingCacheHitPorMilhao = 0.028m;
        private const decimal PricingCacheMissPorMilhao = 0.28m;
        private const decimal PricingOutputPorMilhao = 0.42m;

        private readonly AppDbContext _context;
        private readonly ILogger<RedacaoCorrecaoService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly IServiceScopeFactory _scopeFactory;

        public RedacaoCorrecaoService(
            AppDbContext context,
            ILogger<RedacaoCorrecaoService> logger,
            IConfiguration configuration,
            HttpClient httpClient,
            IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
            _scopeFactory = scopeFactory;
        }

        public async Task<RedacaoCorrecoes> IniciarCorrecaoAsync(
            int userId,
            int? atividadeExecucaoId,
            string tema,
            string textoRedacao,
            string tipoAvaliacao)
        {
            var ehRascunho = string.Equals(tipoAvaliacao, "rascunho", StringComparison.OrdinalIgnoreCase);

            var correcao = new RedacaoCorrecoes
            {
                UserId = userId,
                AtividadeExecucaoId = atividadeExecucaoId,
                Tema = tema,
                TextoRedacao = textoRedacao,
                NotaZero = false,
                NotaTotal = 0,
                ResumoFinal = ehRascunho ? "Rascunho salvo" : "Processando correção...",
                ConfiancaAvaliacao = 0,
                Status = ehRascunho ? "Rascunho" : "Processando",
                Progresso = 0,
                TipoAvaliacao = tipoAvaliacao ?? "ENEM",
                CriadoEm = DateTime.UtcNow
            };

            _context.RedacaoCorrecoes.Add(correcao);
            await _context.SaveChangesAsync();

            if (ehRascunho)
            {
                _logger.LogInformation("Rascunho salvo: ID={CorrecaoId}", correcao.Id);
                return correcao;
            }

            _logger.LogInformation($"Correção iniciada: ID={correcao.Id}");

            // Iniciar processamento em background
            _ = Task.Run(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IRedacaoCorrecaoService>();
                await service.ProcessarCorrecaoAsync(correcao.Id);
            });

            return correcao;
        }

        public async Task<RedacaoCorrecoes> ReenviarCorrecaoAsync(int correcaoId)
        {
            var correcao = await _context.RedacaoCorrecoes
                .FirstOrDefaultAsync(c => c.Id == correcaoId);

            if (correcao == null)
                throw new KeyNotFoundException($"Correção {correcaoId} não encontrada.");

            correcao.Status = "Processando";
            correcao.Progresso = 0;
            correcao.NotaZero = false;
            correcao.MotivoNotaZero = null;
            correcao.NotaTotal = 0;
            correcao.ResumoFinal = "Processando correção...";
            correcao.VersaoReescrita = null;
            correcao.ConfiancaAvaliacao = 0;
            correcao.AtualizadoEm = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Correção reenviada: ID={CorrecaoId}", correcao.Id);

            _ = Task.Run(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IRedacaoCorrecaoService>();
                await service.ProcessarCorrecaoAsync(correcao.Id);
            });

            return correcao;
        }

        public async Task ProcessarCorrecaoAsync(int correcaoId)
        {
            var processamentoStopwatch = Stopwatch.StartNew();
            try
            {
                _logger.LogInformation($"Iniciando processamento da correção {correcaoId}");
                _logger.LogDebug("[Correcao {CorrecaoId}] Etapa 1: buscando correção no banco", correcaoId);

                var correcao = await _context.RedacaoCorrecoes
                    .FirstOrDefaultAsync(c => c.Id == correcaoId);

                if (correcao == null)
                {
                    _logger.LogError($"Correção {correcaoId} não encontrada");
                    return;
                }
                _logger.LogDebug("[Correcao {CorrecaoId}] Etapa 1 concluída: correção encontrada", correcaoId);

                // Atualizar progresso: Iniciando
                _logger.LogDebug("[Correcao {CorrecaoId}] Etapa 2: atualizando progresso para 10", correcaoId);
                await AtualizarProgressoAsync(correcaoId, 10, "Analisando texto");

                // Chamar a API DeepSeek para correção
                _logger.LogDebug("[Correcao {CorrecaoId}] Etapa 3: iniciando avaliação na IA", correcaoId);
                var resultadoCorrecao = await ChamarDeepSeekAPIAsync(correcao);

                if (resultadoCorrecao == null)
                {
                    _logger.LogDebug("[Correcao {CorrecaoId}] Etapa 3 falhou: resultado nulo da IA", correcaoId);
                    await AtualizarProgressoAsync(correcaoId, 0, "Erro na correção");
                    return;
                }
                _logger.LogDebug("[Correcao {CorrecaoId}] Etapa 3 concluída: resultado recebido", correcaoId);

                // Atualizar progresso: Processando resposta
                _logger.LogDebug("[Correcao {CorrecaoId}] Etapa 4: atualizando progresso para 50", correcaoId);
                await AtualizarProgressoAsync(correcaoId, 50, "Processando análise");

                // Salvar resultados no banco
                _logger.LogDebug("[Correcao {CorrecaoId}] Etapa 5: salvando resultados no banco", correcaoId);
                await SalvarResultadosAsync(correcaoId, resultadoCorrecao);
                _logger.LogDebug("[Correcao {CorrecaoId}] Etapa 5 concluída: resultados salvos", correcaoId);

                // Atualizar progresso: Concluído
                _logger.LogDebug("[Correcao {CorrecaoId}] Etapa 6: atualizando progresso para 100", correcaoId);
                await AtualizarProgressoAsync(correcaoId, 100, "Concluída");

                processamentoStopwatch.Stop();
                _logger.LogDebug("[Correcao {CorrecaoId}] Pipeline finalizado em {ElapsedMs}ms", correcaoId, processamentoStopwatch.ElapsedMilliseconds);
                _logger.LogInformation($"Correção {correcaoId} concluída com sucesso");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao processar correção {correcaoId}");
                await AtualizarProgressoAsync(correcaoId, 0, "Erro na correção");
            }
        }

        private async Task<CorrecaoResultado?> ChamarDeepSeekAPIAsync(RedacaoCorrecoes correcao)
        {
            _logger.LogInformation($"Chamando API DeepSeek em paralelo para correção da redação {correcao.Id}");
            var consolidacaoStopwatch = Stopwatch.StartNew();
            try
            {
                var custosAvaliacao = new CustoAvaliacaoAggregator();

                _logger.LogDebug("[Correcao {CorrecaoId}] Disparando 6 tarefas em paralelo (C1-C5 + Anulação)", correcao.Id);
                var competenciaUmTask = AvaliarCompetenciaUmAsync(correcao, custosAvaliacao);
                var competenciaDoisTask = AvaliarCompetenciaDoisAsync(correcao, custosAvaliacao);
                var competenciaTresTask = AvaliarCompetenciaTresAsync(correcao, custosAvaliacao);
                var competenciaQuatroTask = AvaliarCompetenciaQuatroAsync(correcao, custosAvaliacao);
                var competenciaCincoTask = AvaliarCompetenciaCincoAsync(correcao, custosAvaliacao);
                var anulacaoTask = AvaliarAnulacaoAsync(correcao, custosAvaliacao);

                var timeoutLoteSegundos = _configuration.GetValue<int?>("DeepSeek:BatchTimeoutSeconds") ?? TimeoutLoteSegundosPadrao;
                var loteTask = Task.WhenAll(
                    competenciaUmTask,
                    competenciaDoisTask,
                    competenciaTresTask,
                    competenciaQuatroTask,
                    competenciaCincoTask,
                    anulacaoTask);

                var timeoutTask = Task.Delay(TimeSpan.FromSeconds(timeoutLoteSegundos));
                var completedTask = await Task.WhenAny(loteTask, timeoutTask);

                if (completedTask == timeoutTask)
                {
                    _logger.LogError(
                        "[Correcao {CorrecaoId}] Timeout no lote paralelo após {Timeout}s. Status: C1={C1}, C2={C2}, C3={C3}, C4={C4}, C5={C5}, Anulacao={Anulacao}",
                        correcao.Id,
                        timeoutLoteSegundos,
                        competenciaUmTask.Status,
                        competenciaDoisTask.Status,
                        competenciaTresTask.Status,
                        competenciaQuatroTask.Status,
                        competenciaCincoTask.Status,
                        anulacaoTask.Status);
                    return null;
                }

                await loteTask;
                _logger.LogDebug("[Correcao {CorrecaoId}] Todas as tarefas paralelas finalizaram", correcao.Id);

                var competenciaUm = competenciaUmTask.Result;
                var competenciaDois = competenciaDoisTask.Result;
                var competenciaTres = competenciaTresTask.Result;
                var competenciaQuatro = competenciaQuatroTask.Result;
                var competenciaCinco = competenciaCincoTask.Result;
                var anulacao = anulacaoTask.Result;

                if (competenciaUm == null ||
                    competenciaDois == null ||
                    competenciaTres == null ||
                    competenciaQuatro == null ||
                    competenciaCinco == null ||
                    anulacao == null)
                {
                    _logger.LogError($"Uma ou mais avaliações paralelas retornaram nulo para a redação {correcao.Id}");
                    return null;
                }

                _logger.LogDebug("[Correcao {CorrecaoId}] Consolidando avaliações das competências", correcao.Id);

                var competencias = new List<CompetenciaResultado>
                {
                    CriarCompetenciaResultado(1, "Domínio da modalidade escrita formal", competenciaUm),
                    CriarCompetenciaResultado(2, "Compreender a proposta e aplicar áreas de conhecimento", competenciaDois),
                    CriarCompetenciaResultado(3, "Selecionar, organizar e interpretar informações", competenciaTres),
                    CriarCompetenciaResultado(4, "Conhecimento dos mecanismos linguísticos", competenciaQuatro),
                    CriarCompetenciaResultado(5, "Proposta de intervenção e direitos humanos", competenciaCinco)
                };

                var resultado = new CorrecaoResultado
                {
                    NotaZero = anulacao.NotaZero,
                    MotivoNotaZero = anulacao.MotivoNotaZero,
                    Competencias = competencias,
                    ErrosGramaticais = competenciaUm.ErrosGramaticais,
                    Feedbacks = ConsolidarFeedbacks(
                        competenciaUm,
                        competenciaDois,
                        competenciaTres,
                        competenciaQuatro,
                        competenciaCinco),
                    PropostaIntervencao = competenciaCinco.PropostaIntervencao ?? new PropostaIntervencaoResultado
                    {
                        Avaliacao = competenciaCinco.Comentario,
                        SugestoesConcretas = competenciaCinco.Melhorias
                    },
                    ResumoFinal = GerarResumoFinalConsolidado(anulacao, competencias),
                    VersaoReescrita = competenciaTres.SugestaoReescrita,
                    ConfiancaAvaliacao = CalcularConfiancaMedia(
                        anulacao.Confianca,
                        competenciaUm.Confianca,
                        competenciaDois.Confianca,
                        competenciaTres.Confianca,
                        competenciaQuatro.Confianca,
                        competenciaCinco.Confianca),
                    CustosAvaliacao = custosAvaliacao.ToResultado()
                };

                _logger.LogInformation(
                    "[Correcao {CorrecaoId}] Custos IA: hitTokens={HitTokens}, missTokens={MissTokens}, outputTokens={OutputTokens}, total={Total}",
                    correcao.Id,
                    resultado.CustosAvaliacao?.PromptCacheHitTokens,
                    resultado.CustosAvaliacao?.PromptCacheMissTokens,
                    resultado.CustosAvaliacao?.CustoOut,
                    resultado.CustosAvaliacao?.Total);

                consolidacaoStopwatch.Stop();
                _logger.LogDebug("[Correcao {CorrecaoId}] Consolidação concluída em {ElapsedMs}ms", correcao.Id, consolidacaoStopwatch.ElapsedMilliseconds);
                _logger.LogInformation($"Resultado consolidado da redação {correcao.Id} processado com sucesso");
                return resultado;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao chamar API DeepSeek para correção da redação {correcao.Id}");
                return null;
            }
        }

        private async Task<CompetenciaUmAvaliacaoResposta?> AvaliarCompetenciaUmAsync(
            RedacaoCorrecoes correcao,
            CustoAvaliacaoAggregator custosAvaliacao)
        {
            _logger.LogDebug("[Correcao {CorrecaoId}] Iniciando avaliação da Competência I", correcao.Id);
            var stopwatch = Stopwatch.StartNew();
            var prompt = $@"Avalie APENAS a Competência I do ENEM (Domínio da modalidade escrita formal) na redação abaixo.

CRITÉRIOS OBRIGATÓRIOS:
- Estrutura sintática: períodos bem estruturados, com fluidez e sem truncamentos/justaposições indevidas.
- Desvios em convenções da escrita: acentuação, ortografia, hífen, maiúsculas/minúsculas e separação silábica.
- Desvios gramaticais: regência, concordância, tempos verbais, pontuação, paralelismo e crase.
- Escolha de registro: evitar oralidade/informalidade.
- Escolha vocabular: adequação semântica ao contexto.

TEMA: ""{correcao.Tema}""

TEXTO DA REDAÇÃO:
{correcao.TextoRedacao}

Retorne APENAS JSON válido neste formato:
{{
  ""nota"": 0,
  ""comentario"": """",
  ""evidencias"": [""""],
  ""melhorias"": [""""],
  ""errosGramaticais"": [
    {{
      ""posicaoInicio"": 0,
      ""posicaoFim"": 0,
      ""textoOriginal"": """",
      ""textoSugerido"": """",
      ""explicacao"": """",
      ""severidade"": ""baixa|media|alta""
    }}
  ],
  ""pontosPositivos"": [""""],
  ""pontosMelhoria"": [""""],
  ""recomendacoes"": [""""],
  ""confianca"": 0
}}";

            var resposta = await EnviarPromptParaDeepSeekAsync<CompetenciaUmAvaliacaoResposta>(
                "Você é especialista em correção da Competência I do ENEM. Responda apenas JSON.",
                prompt,
                1500,
                "Competência I",
                correcao.Id,
                custosAvaliacao);

            stopwatch.Stop();
            _logger.LogDebug("[Correcao {CorrecaoId}] Competência I finalizada em {ElapsedMs}ms. Resposta nula? {IsNull}", correcao.Id, stopwatch.ElapsedMilliseconds, resposta == null);
            return resposta;
        }

        private async Task<CompetenciaAvaliacaoResposta?> AvaliarCompetenciaDoisAsync(
            RedacaoCorrecoes correcao,
            CustoAvaliacaoAggregator custosAvaliacao)
        {
            _logger.LogDebug("[Correcao {CorrecaoId}] Iniciando avaliação da Competência II", correcao.Id);
            var stopwatch = Stopwatch.StartNew();
            var prompt = $@"Avalie APENAS a Competência II do ENEM na redação abaixo.

CRITÉRIOS OBRIGATÓRIOS:
- Aderência completa ao tema e ao recorte temático (evitar tangenciamento/fuga).
- Tipo textual dissertativo-argumentativo com tese e argumentos.
- Repertório sociocultural legítimo, pertinente e produtivo (articulado à argumentação).
- Evitar repertório genérico/desconectado (""repertório de bolso"").

TEMA: ""{correcao.Tema}""

TEXTO DA REDAÇÃO:
{correcao.TextoRedacao}

Retorne APENAS JSON válido:
{{
  ""nota"": 0,
  ""comentario"": """",
  ""evidencias"": [""""],
  ""melhorias"": [""""],
  ""pontosPositivos"": [""""],
  ""pontosMelhoria"": [""""],
  ""recomendacoes"": [""""],
  ""confianca"": 0
}}";

            var resposta = await EnviarPromptParaDeepSeekAsync<CompetenciaAvaliacaoResposta>(
                "Você é especialista em correção da Competência II do ENEM. Responda apenas JSON.",
                prompt,
                1200,
                "Competência II",
                correcao.Id,
                custosAvaliacao);

            stopwatch.Stop();
            _logger.LogDebug("[Correcao {CorrecaoId}] Competência II finalizada em {ElapsedMs}ms. Resposta nula? {IsNull}", correcao.Id, stopwatch.ElapsedMilliseconds, resposta == null);
            return resposta;
        }

        private async Task<CompetenciaAvaliacaoResposta?> AvaliarCompetenciaTresAsync(
            RedacaoCorrecoes correcao,
            CustoAvaliacaoAggregator custosAvaliacao)
        {
            _logger.LogDebug("[Correcao {CorrecaoId}] Iniciando avaliação da Competência III", correcao.Id);
            var stopwatch = Stopwatch.StartNew();
            var prompt = $@"Avalie APENAS a Competência III do ENEM na redação abaixo.

CRITÉRIOS OBRIGATÓRIOS:
- Projeto de texto estratégico com ordem lógica dos argumentos.
- Desenvolvimento dos argumentos com explicação e justificativa do ponto de vista.
- Progressão temática consistente entre parágrafos, sem lacunas de sentido.

TEMA: ""{correcao.Tema}""

TEXTO DA REDAÇÃO:
{correcao.TextoRedacao}

Retorne APENAS JSON válido:
{{
  ""nota"": 0,
  ""comentario"": """",
  ""evidencias"": [""""],
  ""melhorias"": [""""],
  ""pontosPositivos"": [""""],
  ""pontosMelhoria"": [""""],
  ""recomendacoes"": [""""],
  ""sugestaoReescrita"": """",
  ""confianca"": 0
}}";

            var resposta = await EnviarPromptParaDeepSeekAsync<CompetenciaAvaliacaoResposta>(
                "Você é especialista em correção da Competência III do ENEM. Responda apenas JSON.",
                prompt,
                1300,
                "Competência III",
                correcao.Id,
                custosAvaliacao);

            stopwatch.Stop();
            _logger.LogDebug("[Correcao {CorrecaoId}] Competência III finalizada em {ElapsedMs}ms. Resposta nula? {IsNull}", correcao.Id, stopwatch.ElapsedMilliseconds, resposta == null);
            return resposta;
        }

        private async Task<CompetenciaAvaliacaoResposta?> AvaliarCompetenciaQuatroAsync(
            RedacaoCorrecoes correcao,
            CustoAvaliacaoAggregator custosAvaliacao)
        {
            _logger.LogDebug("[Correcao {CorrecaoId}] Iniciando avaliação da Competência IV", correcao.Id);
            var stopwatch = Stopwatch.StartNew();
            var prompt = $@"Avalie APENAS a Competência IV do ENEM na redação abaixo.

CRITÉRIOS OBRIGATÓRIOS:
- Operadores argumentativos (causa, consequência, contraste, conclusão etc.).
- Referenciação (pronomes/sinônimos/retomadas sem repetição inadequada).
- Estruturação e articulação entre frases e parágrafos com coesão explícita.

TEMA: ""{correcao.Tema}""

TEXTO DA REDAÇÃO:
{correcao.TextoRedacao}

Retorne APENAS JSON válido:
{{
  ""nota"": 0,
  ""comentario"": """",
  ""evidencias"": [""""],
  ""melhorias"": [""""],
  ""pontosPositivos"": [""""],
  ""pontosMelhoria"": [""""],
  ""recomendacoes"": [""""],
  ""confianca"": 0
}}";

            var resposta = await EnviarPromptParaDeepSeekAsync<CompetenciaAvaliacaoResposta>(
                "Você é especialista em correção da Competência IV do ENEM. Responda apenas JSON.",
                prompt,
                1200,
                "Competência IV",
                correcao.Id,
                custosAvaliacao);

            stopwatch.Stop();
            _logger.LogDebug("[Correcao {CorrecaoId}] Competência IV finalizada em {ElapsedMs}ms. Resposta nula? {IsNull}", correcao.Id, stopwatch.ElapsedMilliseconds, resposta == null);
            return resposta;
        }

        private async Task<CompetenciaCincoAvaliacaoResposta?> AvaliarCompetenciaCincoAsync(
            RedacaoCorrecoes correcao,
            CustoAvaliacaoAggregator custosAvaliacao)
        {
            _logger.LogDebug("[Correcao {CorrecaoId}] Iniciando avaliação da Competência V", correcao.Id);
            var stopwatch = Stopwatch.StartNew();
            var prompt = $@"Avalie APENAS a Competência V do ENEM na redação abaixo.

CRITÉRIOS OBRIGATÓRIOS:
- Proposta de intervenção com os 5 elementos: Ação, Agente, Meio/Modo, Efeito/Finalidade e Detalhamento.
- Respeito aos direitos humanos.

TEMA: ""{correcao.Tema}""

TEXTO DA REDAÇÃO:
{correcao.TextoRedacao}

Retorne APENAS JSON válido:
{{
  ""nota"": 0,
  ""comentario"": """",
  ""evidencias"": [""""],
  ""melhorias"": [""""],
  ""pontosPositivos"": [""""],
  ""pontosMelhoria"": [""""],
  ""recomendacoes"": [""""],
    ""propostaIntervencao"": {{
    ""avaliacao"": """",
    ""sugestoesConcretas"": [""""]
    }},
  ""confianca"": 0
}}";

            var resposta = await EnviarPromptParaDeepSeekAsync<CompetenciaCincoAvaliacaoResposta>(
                "Você é especialista em correção da Competência V do ENEM. Responda apenas JSON.",
                prompt,
                1400,
                "Competência V",
                correcao.Id,
                custosAvaliacao);

            stopwatch.Stop();
            _logger.LogDebug("[Correcao {CorrecaoId}] Competência V finalizada em {ElapsedMs}ms. Resposta nula? {IsNull}", correcao.Id, stopwatch.ElapsedMilliseconds, resposta == null);
            return resposta;
        }

        private async Task<AnulacaoAvaliacaoResposta?> AvaliarAnulacaoAsync(
            RedacaoCorrecoes correcao,
            CustoAvaliacaoAggregator custosAvaliacao)
        {
            _logger.LogDebug("[Correcao {CorrecaoId}] Iniciando avaliação de anulação", correcao.Id);
            var stopwatch = Stopwatch.StartNew();
            var prompt = $@"Avalie se a redação abaixo deve ser ANULADA, considerando estritamente os critérios.

ANULAÇÃO (NOTA ZERO):
1) Fuga total ao tema ou não obediência ao tipo dissertativo-argumentativo.
2) Extensão insuficiente: mínimo 20 linhas e máximo 30 linhas.
3) Identificação do participante, impropérios/desenhos, bilhetes, mensagens desconectadas, partes deliberadamente desconectadas.
4) Folha em branco ou texto predominantemente em língua estrangeira.

TEMA: ""{correcao.Tema}""

TEXTO DA REDAÇÃO:
{correcao.TextoRedacao}

Retorne APENAS JSON válido:
{{
  ""notaZero"": false,
  ""motivoNotaZero"": null,
  ""confianca"": 0
}}";

            var resposta = await EnviarPromptParaDeepSeekAsync<AnulacaoAvaliacaoResposta>(
                "Você é especialista em critérios de anulação da redação ENEM. Responda apenas JSON.",
                prompt,
                900,
                "Anulação",
                correcao.Id,
                custosAvaliacao);

            stopwatch.Stop();
            _logger.LogDebug("[Correcao {CorrecaoId}] Avaliação de anulação finalizada em {ElapsedMs}ms. Resposta nula? {IsNull}", correcao.Id, stopwatch.ElapsedMilliseconds, resposta == null);
            return resposta;
        }

        private async Task<T?> EnviarPromptParaDeepSeekAsync<T>(
            string systemPrompt,
            string userPrompt,
            int maxTokens,
            string etapa,
            int correcaoId,
            CustoAvaliacaoAggregator custosAvaliacao)
        {
            var requestStopwatch = Stopwatch.StartNew();

            _logger.LogDebug("[Correcao {CorrecaoId} | {Etapa}] Preparando requisição para API DeepSeek", correcaoId, etapa);
            var apiKey = _configuration["DeepSeek:ApiKey"] ?? "";
            var apiUrl = _configuration["DeepSeek:ApiUrl"] ?? "https://api.deepseek.com/v1/chat/completions";

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogError("[Correcao {CorrecaoId} | {Etapa}] API Key do DeepSeek não configurada", correcaoId, etapa);
                return default;
            }

            _logger.LogDebug(
                "[Correcao {CorrecaoId} | {Etapa}] Enviando prompt (chars={PromptLength}, maxTokens={MaxTokens})",
                correcaoId,
                etapa,
                userPrompt.Length,
                maxTokens);

            var requestBody = new
            {
                model = "deepseek-chat",
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                },
                temperature = 0.2,
                max_tokens = maxTokens,
                response_format = new { type = "json_object" }
            };

            var jsonContent = JsonSerializer.Serialize(requestBody);
            using var request = new HttpRequestMessage(HttpMethod.Post, apiUrl)
            {
                Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var timeoutRequestSegundos = _configuration.GetValue<int?>("DeepSeek:RequestTimeoutSeconds") ?? TimeoutRequestSegundosPadrao;

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(timeoutRequestSegundos));

            HttpResponseMessage response;
            string responseContent;
            try
            {
                response = await _httpClient.SendAsync(request, cts.Token);
                responseContent = await response.Content.ReadAsStringAsync(cts.Token);
            }
            catch (OperationCanceledException)
            {
                _logger.LogError(
                    "[Correcao {CorrecaoId} | {Etapa}] Timeout após {Timeout}s aguardando resposta da API DeepSeek",
                    correcaoId,
                    etapa,
                    timeoutRequestSegundos);
                return default;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Correcao {CorrecaoId} | {Etapa}] Erro de comunicação com a API DeepSeek", correcaoId, etapa);
                return default;
            }

            _logger.LogDebug(
                "[Correcao {CorrecaoId} | {Etapa}] HTTP concluído com status {StatusCode} (response chars={ResponseLength})",
                correcaoId,
                etapa,
                (int)response.StatusCode,
                responseContent?.Length ?? 0);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"[Correcao {correcaoId} | {etapa}] Erro na API DeepSeek: {response.StatusCode} - {responseContent}");
                return default;
            }

            var apiResponse = JsonSerializer.Deserialize<DeepSeekResponse>(responseContent);
            var messageContent = apiResponse?.choices?[0]?.message?.content;

            if (apiResponse?.usage != null)
            {
                custosAvaliacao.Adicionar(
                    apiResponse.usage.prompt_cache_hit_tokens,
                    apiResponse.usage.prompt_cache_miss_tokens,
                    apiResponse.usage.completion_tokens);

                _logger.LogDebug(
                    "[Correcao {CorrecaoId} | {Etapa}] Tokens uso: hit={Hit}, miss={Miss}, out={Out}",
                    correcaoId,
                    etapa,
                    apiResponse.usage.prompt_cache_hit_tokens,
                    apiResponse.usage.prompt_cache_miss_tokens,
                    apiResponse.usage.completion_tokens);
            }

            _logger.LogDebug(
                "[Correcao {CorrecaoId} | {Etapa}] Conteúdo de message extraído? {HasContent}",
                correcaoId,
                etapa,
                !string.IsNullOrWhiteSpace(messageContent));

            if (string.IsNullOrWhiteSpace(messageContent))
            {
                _logger.LogError("[Correcao {CorrecaoId} | {Etapa}] Resposta vazia da API DeepSeek", correcaoId, etapa);
                return default;
            }

            try
            {
                var resultado = JsonSerializer.Deserialize<T>(messageContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                requestStopwatch.Stop();
                _logger.LogDebug(
                    "[Correcao {CorrecaoId} | {Etapa}] Desserialização concluída em {ElapsedMs}ms. Resultado nulo? {IsNull}",
                    correcaoId,
                    etapa,
                    requestStopwatch.ElapsedMilliseconds,
                    resultado == null);

                return resultado;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Correcao {CorrecaoId} | {Etapa}] Falha ao desserializar resposta da IA", correcaoId, etapa);
                return default;
            }
        }

        private CompetenciaResultado CriarCompetenciaResultado(
            int numero,
            string nome,
            CompetenciaAvaliacaoResposta resposta)
        {
            return new CompetenciaResultado
            {
                NumeroCompetencia = numero,
                NomeCompetencia = nome,
                Nota = NormalizarNota(resposta.Nota),
                Comentario = resposta.Comentario,
                Evidencias = resposta.Evidencias,
                Melhorias = resposta.Melhorias
            };
        }

        private FeedbacksResultado ConsolidarFeedbacks(params CompetenciaAvaliacaoResposta[] respostas)
        {
            var positivos = respostas
                .SelectMany(r => r.PontosPositivos ?? new List<string>())
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Distinct()
                .ToList();

            var melhorias = respostas
                .SelectMany(r => r.PontosMelhoria ?? new List<string>())
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Distinct()
                .ToList();

            var recomendacoes = respostas
                .SelectMany(r => r.Recomendacoes ?? new List<string>())
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Distinct()
                .ToList();

            return new FeedbacksResultado
            {
                PontosPositivos = positivos,
                PontosMelhoria = melhorias,
                Recomendacoes = recomendacoes
            };
        }

        private static int NormalizarNota(int nota)
        {
            if (nota < 0) return 0;
            if (nota > 200) return 200;
            return nota;
        }

        private static decimal CalcularConfiancaMedia(params decimal[] confiancas)
        {
            var validas = confiancas.Where(c => c > 0).ToList();
            if (!validas.Any()) return 0;
            return Math.Round(validas.Average(), 2);
        }

        private static string GerarResumoFinalConsolidado(
            AnulacaoAvaliacaoResposta anulacao,
            List<CompetenciaResultado> competencias)
        {
            if (anulacao.NotaZero)
            {
                return $"Redação com nota zero pelos critérios de anulação. Motivo: {anulacao.MotivoNotaZero}";
            }

            var media = competencias.Any() ? competencias.Average(c => c.Nota) : 0;
            return $"Correção concluída por competências. Média das competências: {Math.Round(media, 2)}. Nota total: {competencias.Sum(c => c.Nota)}.";
        }

        private async Task SalvarResultadosAsync(int correcaoId, CorrecaoResultado resultado)
        {
            _logger.LogDebug("[Correcao {CorrecaoId}] Iniciando persistência dos resultados", correcaoId);
            var salvarStopwatch = Stopwatch.StartNew();
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

            var custoExistente = await _context.RedacaoCustos
                .FirstOrDefaultAsync(c => c.FkRedacao == correcaoId);

            if (custoExistente != null)
                _context.RedacaoCustos.Remove(custoExistente);

            // Atualizar correção principal
            correcao.NotaZero = resultado.NotaZero;
            correcao.MotivoNotaZero = resultado.MotivoNotaZero;
            correcao.NotaTotal = resultado.Competencias?.Sum(c => c.Nota) ?? 0;
            correcao.ResumoFinal = resultado.ResumoFinal;
            correcao.VersaoReescrita = resultado.VersaoReescrita;
            correcao.ConfiancaAvaliacao = resultado.ConfiancaAvaliacao;
            correcao.AtualizadoEm = DateTime.UtcNow;

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

            if (resultado.CustosAvaliacao != null)
            {
                _context.RedacaoCustos.Add(new RedacaoCustos
                {
                    FkRedacao = correcaoId,
                    PromptCacheHitTokens = resultado.CustosAvaliacao.PromptCacheHitTokens,
                    PromptCacheHitPricing = resultado.CustosAvaliacao.PromptCacheHitPricing,
                    PromptCacheMissTokens = resultado.CustosAvaliacao.PromptCacheMissTokens,
                    PromptCacheMissPricing = resultado.CustosAvaliacao.PromptCacheMissPricing,
                    CustoOut = resultado.CustosAvaliacao.CustoOut,
                    CustoOutPricing = resultado.CustosAvaliacao.CustoOutPricing,
                    Total = resultado.CustosAvaliacao.Total
                });
            }

            await _context.SaveChangesAsync();
            salvarStopwatch.Stop();
            _logger.LogDebug("[Correcao {CorrecaoId}] Persistência concluída em {ElapsedMs}ms", correcaoId, salvarStopwatch.ElapsedMilliseconds);
        }

        public async Task AtualizarProgressoAsync(int correcaoId, int progresso, string status)
        {
            _logger.LogDebug("[Correcao {CorrecaoId}] Atualizando progresso: {Progresso} - {Status}", correcaoId, progresso, status);
            var correcao = await _context.RedacaoCorrecoes.FindAsync(correcaoId);
            if (correcao != null)
            {
                correcao.Progresso = progresso;
                correcao.Status = status;
                correcao.AtualizadoEm = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogDebug("[Correcao {CorrecaoId}] Progresso atualizado com sucesso", correcaoId);
            }
            else
            {
                _logger.LogDebug("[Correcao {CorrecaoId}] Registro não encontrado ao atualizar progresso", correcaoId);
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
        public CustoAvaliacaoResultado? CustosAvaliacao { get; set; }
    }

    public class CustoAvaliacaoResultado
    {
        public int PromptCacheHitTokens { get; set; }
        public decimal PromptCacheHitPricing { get; set; }
        public int PromptCacheMissTokens { get; set; }
        public decimal PromptCacheMissPricing { get; set; }
        public int CustoOut { get; set; }
        public decimal CustoOutPricing { get; set; }
        public decimal Total { get; set; }
    }

    public class CustoAvaliacaoAggregator
    {
        private const decimal PricingCacheHitPorMilhao = 0.028m;
        private const decimal PricingCacheMissPorMilhao = 0.28m;
        private const decimal PricingOutputPorMilhao = 0.42m;

        private readonly object _sync = new();

        private int _promptCacheHitTokens;
        private int _promptCacheMissTokens;
        private int _completionTokens;

        public void Adicionar(int promptCacheHitTokens, int promptCacheMissTokens, int completionTokens)
        {
            lock (_sync)
            {
                _promptCacheHitTokens += Math.Max(0, promptCacheHitTokens);
                _promptCacheMissTokens += Math.Max(0, promptCacheMissTokens);
                _completionTokens += Math.Max(0, completionTokens);
            }
        }

        public CustoAvaliacaoResultado ToResultado()
        {
            lock (_sync)
            {
                var hitPricing = Math.Round((_promptCacheHitTokens / 1000000m) * PricingCacheHitPorMilhao, 8);
                var missPricing = Math.Round((_promptCacheMissTokens / 1000000m) * PricingCacheMissPorMilhao, 8);
                var outPricing = Math.Round((_completionTokens / 1000000m) * PricingOutputPorMilhao, 8);
                var total = Math.Round(hitPricing + missPricing + outPricing, 8);

                return new CustoAvaliacaoResultado
                {
                    PromptCacheHitTokens = _promptCacheHitTokens,
                    PromptCacheHitPricing = hitPricing,
                    PromptCacheMissTokens = _promptCacheMissTokens,
                    PromptCacheMissPricing = missPricing,
                    CustoOut = _completionTokens,
                    CustoOutPricing = outPricing,
                    Total = total
                };
            }
        }
    }

    public class CompetenciaAvaliacaoResposta
    {
        public int Nota { get; set; }
        public string? Comentario { get; set; }
        public List<string>? Evidencias { get; set; }
        public List<string>? Melhorias { get; set; }
        public List<string>? PontosPositivos { get; set; }
        public List<string>? PontosMelhoria { get; set; }
        public List<string>? Recomendacoes { get; set; }
        public string? SugestaoReescrita { get; set; }
        public decimal Confianca { get; set; }
    }

    public class CompetenciaUmAvaliacaoResposta : CompetenciaAvaliacaoResposta
    {
        public List<ErroGramaticalResultado>? ErrosGramaticais { get; set; }
    }

    public class CompetenciaCincoAvaliacaoResposta : CompetenciaAvaliacaoResposta
    {
        public PropostaIntervencaoResultado? PropostaIntervencao { get; set; }
    }

    public class AnulacaoAvaliacaoResposta
    {
        public bool NotaZero { get; set; }
        public string? MotivoNotaZero { get; set; }
        public decimal Confianca { get; set; }
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
        public DeepSeekUsage? usage { get; set; }
    }

    public class DeepSeekUsage
    {
        public int completion_tokens { get; set; }
        public int prompt_cache_hit_tokens { get; set; }
        public int prompt_cache_miss_tokens { get; set; }
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
