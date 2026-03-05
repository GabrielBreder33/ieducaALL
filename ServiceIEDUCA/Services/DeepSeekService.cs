using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ServiceIEDUCA.Services
{
    public class DeepSeekService : IDeepSeekService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DeepSeekService> _logger;
        private readonly string _apiKey;
        private readonly string _baseUrl;
        private readonly string _model;
        private readonly int _maxTokensAtividade;
        private readonly double _temperatureAtividade;

        public DeepSeekService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<DeepSeekService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            
            _apiKey = _configuration["DeepSeek:ApiKey"] ?? throw new Exception("DeepSeek ApiKey não configurada");
            _baseUrl = _configuration["DeepSeek:BaseUrl"] ?? "https://api.deepseek.com/v1";
            _model = _configuration["DeepSeek:Model"] ?? "deepseek-chat";
            _maxTokensAtividade = _configuration.GetValue<int?>("DeepSeek:MaxTokensAtividade") ?? 4000;
            _temperatureAtividade = _configuration.GetValue<double?>("DeepSeek:TemperatureAtividade") ?? 0.3;
        }

        public async Task<string> GerarAtividadeAsync(string prompt, int? maxTokensOverride = null, CancellationToken cancellationToken = default)
        {
            var maxTokens = maxTokensOverride ?? _maxTokensAtividade;
            var requestBody = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "system", content = "Você é um professor especialista criando questões de múltipla escolha para estudantes brasileiros. Sempre retorne as questões em formato JSON válido." },
                    new { role = "user", content = prompt }
                },
                temperature = _temperatureAtividade,
                max_tokens = maxTokens,
                response_format = new { type = "json_object" }
            };

            var json = JsonSerializer.Serialize(requestBody);

            _logger.LogInformation("DeepSeek geração: Model={Model}, MaxTokens={MaxTokens}, Temperature={Temperature}", _model, maxTokens, _temperatureAtividade);

            // Retry logic: 3 attempts with exponential backoff
            const int maxAttempts = 3;
            int attempt = 0;
            while (true)
            {
                attempt++;
                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/chat/completions");
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                    request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    request.Content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                    var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

                    if (!response.IsSuccessStatusCode)
                    {
                        _logger.LogError("Erro na API DeepSeek: {Status} - {Body}", response.StatusCode, responseContent);
                        throw new Exception($"Erro na API DeepSeek: {response.StatusCode}");
                    }

                    var result = JsonSerializer.Deserialize<JsonElement>(responseContent);
                    var messageContent = result
                        .GetProperty("choices")[0]
                        .GetProperty("message")
                        .GetProperty("content")
                        .GetString();

                    _logger.LogInformation("Atividade gerada com sucesso (attempt {Attempt})", attempt);
                    return messageContent ?? string.Empty;
                }
                catch (TaskCanceledException tex)
                {
                    _logger.LogWarning(tex, "Timeout/cancelamento ao chamar DeepSeek (attempt {Attempt})", attempt);
                    if (attempt >= maxAttempts) throw;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao chamar DeepSeek (attempt {Attempt})", attempt);
                    if (attempt >= maxAttempts) throw;
                }

                // Exponential backoff before retrying
                var backoffMs = 500 * (int)Math.Pow(2, attempt - 1);
                _logger.LogInformation("Aguardando {BackoffMs}ms antes de nova tentativa...", backoffMs);
                await Task.Delay(backoffMs);
            }
        }
    }
}
