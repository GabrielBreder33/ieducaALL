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
        }

        public async Task<string> GerarAtividadeAsync(string prompt)
        {
            try
            {
                _logger.LogInformation("Gerando atividade com DeepSeek");

                var requestBody = new
                {
                    model = _model,
                    messages = new[]
                    {
                        new { role = "system", content = "Você é um professor especialista criando questões de múltipla escolha para estudantes brasileiros. Sempre retorne as questões em formato JSON válido." },
                        new { role = "user", content = prompt }
                    },
                    temperature = 0.7,
                    max_tokens = 4000
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");

                var response = await _httpClient.PostAsync($"{_baseUrl}/chat/completions", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Erro na API DeepSeek: {response.StatusCode} - {responseContent}");
                    throw new Exception($"Erro na API DeepSeek: {response.StatusCode}");
                }

                var result = JsonSerializer.Deserialize<JsonElement>(responseContent);
                var messageContent = result
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                _logger.LogInformation("Atividade gerada com sucesso");
                return messageContent ?? "";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar atividade com DeepSeek");
                throw;
            }
        }
    }
}
