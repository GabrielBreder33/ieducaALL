using System.Text;
using System.Text.Json;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.Models;
using UglyToad.PdfPig;

namespace ServiceIEDUCA.Services
{
    public class MaterialService : IMaterialService
    {
        private readonly AppDbContext _context;
        private readonly IDeepSeekService _deepSeekService;
        private readonly ILogger<MaterialService> _logger;

        public MaterialService(
            AppDbContext context,
            IDeepSeekService deepSeekService,
            ILogger<MaterialService> logger)
        {
            _context = context;
            _deepSeekService = deepSeekService;
            _logger = logger;
        }

        public string ExtrairTextoPdf(Stream pdfStream)
        {
            var sb = new StringBuilder();

            using var document = PdfDocument.Open(pdfStream);
            foreach (var page in document.GetPages())
            {
                var text = page.Text;
                if (!string.IsNullOrWhiteSpace(text))
                {
                    sb.AppendLine(text);
                    sb.AppendLine(); // separador entre páginas
                }
            }

            return sb.ToString().Trim();
        }

        public async Task<string> ExtrairQuestoesComIAAsync(string textoExtraido, CancellationToken cancellationToken = default)
        {
            const int maxCharsPerChunk = 6000; // ~1500 tokens de input por chunk, seguro para API

            if (textoExtraido.Length <= maxCharsPerChunk)
            {
                return await ExtrairQuestoesChunkAsync(textoExtraido, 0, cancellationToken);
            }

            _logger.LogInformation("Texto muito grande ({Length} chars). Dividindo em partes para processar...", textoExtraido.Length);

            var chunks = DividirTextoEmChunks(textoExtraido, maxCharsPerChunk);
            _logger.LogInformation("Texto dividido em {Count} partes", chunks.Count);

            var todasQuestoes = new List<JsonElement>();
            var ultimoNumero = 0;

            for (int i = 0; i < chunks.Count; i++)
            {
                _logger.LogInformation("Processando parte {Parte}/{Total} ({Length} chars)...", i + 1, chunks.Count, chunks[i].Length);

                var resultado = await ExtrairQuestoesChunkAsync(chunks[i], ultimoNumero, cancellationToken);

                try
                {
                    var parsed = JsonSerializer.Deserialize<JsonElement>(resultado);
                    if (parsed.TryGetProperty("questoes", out var questoesArray))
                    {
                        foreach (var q in questoesArray.EnumerateArray())
                        {
                            todasQuestoes.Add(q.Clone());
                            if (q.TryGetProperty("numero", out var num) && num.TryGetInt32(out var n))
                            {
                                if (n > ultimoNumero) ultimoNumero = n;
                            }
                        }
                        _logger.LogInformation("Parte {Parte}: {Count} questões extraídas (total acumulado: {Total})",
                            i + 1, questoesArray.GetArrayLength(), todasQuestoes.Count);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Erro ao parsear resultado da parte {Parte}, pulando...", i + 1);
                }
            }

            // Renumerar e montar JSON final
            var questoesFinais = new List<object>();
            for (int i = 0; i < todasQuestoes.Count; i++)
            {
                var q = todasQuestoes[i];
                var obj = new Dictionary<string, object?>
                {
                    ["numero"] = i + 1,
                    ["enunciado"] = q.TryGetProperty("enunciado", out var en) ? en.GetString() : "",
                    ["alternativas"] = q.TryGetProperty("alternativas", out var alts) ? alts.Clone() : JsonSerializer.Deserialize<JsonElement>("[]"),
                    ["gabarito"] = q.TryGetProperty("gabarito", out var gab) ? gab.GetString() : null,
                    ["explicacao"] = q.TryGetProperty("explicacao", out var exp) && exp.ValueKind != JsonValueKind.Null ? exp.GetString() : null
                };
                questoesFinais.Add(obj);
            }

            var resultadoFinal = JsonSerializer.Serialize(new { questoes = questoesFinais, conteudo_extra = (string?)null },
                new JsonSerializerOptions { WriteIndented = false });

            _logger.LogInformation("Extração completa: {Total} questões de {Chunks} partes", todasQuestoes.Count, chunks.Count);
            return resultadoFinal;
        }

        private List<string> DividirTextoEmChunks(string texto, int maxChars)
        {
            var chunks = new List<string>();
            var linhas = texto.Split('\n');
            var chunk = new StringBuilder();

            foreach (var linha in linhas)
            {
                // Se adicionar esta linha ultrapassar o limite, salvar o chunk atual
                if (chunk.Length + linha.Length + 1 > maxChars && chunk.Length > 0)
                {
                    chunks.Add(chunk.ToString().Trim());
                    // Guardar alguma sobreposição para não cortar questão no meio
                    var overlap = chunk.ToString();
                    chunk.Clear();
                    // Pegar as últimas linhas como contexto
                    var lastLines = overlap.Split('\n');
                    var overlapStart = Math.Max(0, lastLines.Length - 5);
                    for (int i = overlapStart; i < lastLines.Length; i++)
                    {
                        chunk.AppendLine(lastLines[i]);
                    }
                }
                chunk.AppendLine(linha);
            }

            if (chunk.Length > 0)
                chunks.Add(chunk.ToString().Trim());

            return chunks;
        }

        private async Task<string> ExtrairQuestoesChunkAsync(string textoChunk, int questoesJaExtraidas, CancellationToken cancellationToken)
        {
            var contexto = questoesJaExtraidas > 0
                ? $"\n\nATENÇÃO: Já foram extraídas {questoesJaExtraidas} questões de partes anteriores. Comece a numerar a partir de {questoesJaExtraidas + 1}. NÃO repita questões já extraídas."
                : "";

            var prompt = $@"Você é um assistente especialista em educação. Analise o texto abaixo que foi extraído de um PDF de material didático/prova.

Sua tarefa é identificar e extrair TODAS as questões encontradas no texto, separando enunciado, alternativas e gabarito (se disponível).

IMPORTANTE: 
- Extraia TODAS as questões do texto, não pule nenhuma.
- Seja CONCISO nos enunciados. Mantenha apenas o essencial.
- NÃO omita alternativas.{contexto}

Retorne um JSON válido no seguinte formato:
{{
  ""questoes"": [
    {{
      ""numero"": {questoesJaExtraidas + 1},
      ""enunciado"": ""Texto da questão (resumido)"",
      ""alternativas"": [
        {{ ""letra"": ""A"", ""texto"": ""Texto da alternativa A"" }},
        {{ ""letra"": ""B"", ""texto"": ""Texto da alternativa B"" }},
        {{ ""letra"": ""C"", ""texto"": ""Texto da alternativa C"" }},
        {{ ""letra"": ""D"", ""texto"": ""Texto da alternativa D"" }},
        {{ ""letra"": ""E"", ""texto"": ""Texto da alternativa E"" }}
      ],
      ""gabarito"": ""A"",
      ""explicacao"": null
    }}
  ]
}}

Se não houver questões nesta parte do texto, retorne:
{{ ""questoes"": [] }}

TEXTO EXTRAÍDO DO PDF:
{textoChunk}";

            var resultado = await _deepSeekService.GerarAtividadeAsync(prompt, 8000, cancellationToken);

            // Limpar markdown code blocks que a IA pode retornar
            resultado = resultado.Trim();
            if (resultado.StartsWith("```json")) resultado = resultado[7..];
            else if (resultado.StartsWith("```")) resultado = resultado[3..];
            if (resultado.EndsWith("```")) resultado = resultado[..^3];
            resultado = resultado.Trim();

            // Tentar reparar JSON truncado
            resultado = RepararJsonTruncado(resultado);

            return resultado;
        }

        /// <summary>
        /// Tenta reparar um JSON truncado fechando arrays e objetos abertos.
        /// </summary>
        private string RepararJsonTruncado(string json)
        {
            try
            {
                // Se já é válido, retorna como está
                JsonSerializer.Deserialize<JsonElement>(json);
                return json;
            }
            catch
            {
                _logger.LogWarning("JSON truncado detectado ({Length} chars). Tentando reparar...", json.Length);
            }

            // Encontrar a última questão completa (que tem "gabarito")
            // Procurar pelo último "}" que fecha uma questão completa
            var lastGabarito = json.LastIndexOf("\"gabarito\"");
            if (lastGabarito < 0)
            {
                // Sem gabarito, tentar fechar na última alternativa completa
                lastGabarito = json.LastIndexOf("\"alternativas\"");
            }

            if (lastGabarito > 0)
            {
                // Encontrar o próximo "}" que fecha o objeto da questão após o gabarito
                var depth = 0;
                var endOfQuestion = -1;
                var foundGabarito = false;

                for (int i = lastGabarito; i < json.Length; i++)
                {
                    if (json[i] == '{') depth++;
                    if (json[i] == '}')
                    {
                        if (depth > 0) depth--;
                        else
                        {
                            endOfQuestion = i;
                            foundGabarito = true;
                            break;
                        }
                    }
                }

                if (!foundGabarito)
                {
                    // Tentar buscar a última questão que fecha corretamente ANTES do truncamento
                    // Encontrar o último '}' seguido de ',' ou ']'
                    var lastCompleteObj = -1;
                    for (int i = json.Length - 1; i >= 0; i--)
                    {
                        if (json[i] == '}')
                        {
                            // Verificar se após este } vem , ou ] (questão completa)
                            for (int j = i + 1; j < json.Length; j++)
                            {
                                if (json[j] == ' ' || json[j] == '\n' || json[j] == '\r' || json[j] == '\t') continue;
                                if (json[j] == ',' || json[j] == ']')
                                {
                                    lastCompleteObj = i;
                                    break;
                                }
                                break;
                            }
                            if (lastCompleteObj > 0) break;
                        }
                    }

                    if (lastCompleteObj > 0)
                    {
                        endOfQuestion = lastCompleteObj;
                    }
                }

                if (endOfQuestion > 0 && endOfQuestion < json.Length)
                {
                    // Cortar no final da última questão completa e fechar o JSON
                    var repaired = json[..(endOfQuestion + 1)] + "\n    ]\n}";

                    try
                    {
                        JsonSerializer.Deserialize<JsonElement>(repaired);
                        _logger.LogInformation("JSON reparado com sucesso! Original: {Original} chars, Reparado: {Repaired} chars",
                            json.Length, repaired.Length);
                        return repaired;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning("Reparo nível 1 falhou: {Error}", ex.Message);
                    }
                }
            }

            // Abordagem de força bruta: contar brackets e fechar
            var stack = new Stack<char>();
            var inString = false;
            var escape = false;

            foreach (var c in json)
            {
                if (escape) { escape = false; continue; }
                if (c == '\\') { escape = true; continue; }
                if (c == '"') { inString = !inString; continue; }
                if (inString) continue;

                if (c == '{' || c == '[') stack.Push(c);
                else if (c == '}' && stack.Count > 0 && stack.Peek() == '{') stack.Pop();
                else if (c == ']' && stack.Count > 0 && stack.Peek() == '[') stack.Pop();
            }

            if (stack.Count > 0)
            {
                // Remover a última propriedade/valor incompleto
                var trimmed = json.TrimEnd();
                // Se termina no meio de uma string, fechar
                if (inString) trimmed += "\"";
                // Se termina com uma vírgula ou dois pontos, remover
                while (trimmed.Length > 0 && (trimmed[^1] == ',' || trimmed[^1] == ':'))
                    trimmed = trimmed[..^1].TrimEnd();

                // Fechar os brackets abertos
                var closingBrackets = new StringBuilder();
                foreach (var bracket in stack)
                {
                    closingBrackets.Append(bracket == '{' ? '}' : ']');
                }

                var bruteFix = trimmed + closingBrackets.ToString();
                try
                {
                    JsonSerializer.Deserialize<JsonElement>(bruteFix);
                    _logger.LogInformation("JSON reparado (força bruta) com sucesso!");
                    return bruteFix;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Reparo força bruta também falhou: {Error}", ex.Message);
                }
            }

            // Se nada funcionar, retorna o original
            _logger.LogError("Não foi possível reparar o JSON truncado");
            return json;
        }

        public async Task<Material> ProcessarPdfAsync(
            Stream pdfStream,
            string nomeArquivo,
            int professorId,
            string nome,
            string? descricao,
            int? materiaId,
            CancellationToken cancellationToken = default)
        {
            var material = new Material
            {
                ProfessorId = professorId,
                Nome = nome,
                Descricao = descricao,
                MateriaId = materiaId,
                Tipo = "PDF",
                Status = "Processando",
                CriadoEm = DateTime.UtcNow
            };

            _context.Materiais.Add(material);
            await _context.SaveChangesAsync(cancellationToken);

            try
            {
                // 1. Extrair texto do PDF
                _logger.LogInformation("Extraindo texto do PDF para Material {MaterialId}", material.Id);
                var textoExtraido = ExtrairTextoPdf(pdfStream);

                if (string.IsNullOrWhiteSpace(textoExtraido))
                {
                    material.Status = "Erro";
                    material.ErroProcessamento = "Não foi possível extrair texto do PDF. O arquivo pode estar protegido ou conter apenas imagens.";
                    material.AtualizadoEm = DateTime.UtcNow;
                    await _context.SaveChangesAsync(cancellationToken);
                    return material;
                }

                material.ConteudoTexto = textoExtraido;

                // 2. Enviar para IA extrair questões
                _logger.LogInformation("Enviando texto para IA processar questões do Material {MaterialId}", material.Id);
                var questoesJson = await ExtrairQuestoesComIAAsync(textoExtraido, cancellationToken);

                material.QuestoesJson = questoesJson;

                // Log primeiros caracteres para diagnóstico
                _logger.LogInformation("Material {MaterialId} - JSON recebido (primeiros 300 chars): {JsonPreview}",
                    material.Id, questoesJson.Length > 300 ? questoesJson[..300] : questoesJson);

                // Contar questões
                try
                {
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var parsed = JsonSerializer.Deserialize<JsonElement>(questoesJson, options);

                    // Tentar diferentes nomes de propriedade
                    if (parsed.TryGetProperty("questoes", out var questoesArray) ||
                        parsed.TryGetProperty("Questoes", out questoesArray) ||
                        parsed.TryGetProperty("QUESTOES", out questoesArray))
                    {
                        material.TotalQuestoes = questoesArray.GetArrayLength();
                        _logger.LogInformation("Material {MaterialId} - Propriedade 'questoes' encontrada com {Total} itens",
                            material.Id, material.TotalQuestoes);
                    }
                    else
                    {
                        // Listar as propriedades disponíveis para diagnóstico
                        var props = new List<string>();
                        foreach (var prop in parsed.EnumerateObject())
                        {
                            props.Add($"{prop.Name}({prop.Value.ValueKind})");
                        }
                        _logger.LogWarning("Material {MaterialId} - Propriedade 'questoes' NÃO encontrada. Propriedades disponíveis: {Props}",
                            material.Id, string.Join(", ", props));
                        material.TotalQuestoes = 0;
                    }
                }
                catch (Exception jsonEx)
                {
                    _logger.LogError(jsonEx, "Material {MaterialId} - Erro ao parsear JSON de questões. Conteúdo: {Content}",
                        material.Id, questoesJson.Length > 500 ? questoesJson[..500] : questoesJson);
                    material.TotalQuestoes = 0;
                }

                material.Status = "Concluido";
                material.AtualizadoEm = DateTime.UtcNow;

                _logger.LogInformation("Material {MaterialId} processado com sucesso. {TotalQuestoes} questões encontradas", material.Id, material.TotalQuestoes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar Material {MaterialId}", material.Id);
                material.Status = "Erro";
                material.ErroProcessamento = ex.Message;
                material.AtualizadoEm = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
            return material;
        }
    }
}
