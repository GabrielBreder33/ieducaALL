using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Controllers;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Models;
using System.Text.Json;

namespace ServiceIEDUCA.Services
{
    public class ProfessorService : IProfessorService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ProfessorService> _logger;
        private readonly IDeepSeekService _deepSeekService;

        public ProfessorService(AppDbContext context, ILogger<ProfessorService> logger, IDeepSeekService deepSeekService)
        {
            _context = context;
            _logger = logger;
            _deepSeekService = deepSeekService;
        }

        public async Task<AtribuicaoAtividadeDto> CriarAtividadeEAtribuirAsync(CriarAtividadeProfessorDto dto)
        {
            var professor = await _context.Users.FindAsync(dto.ProfessorId);
            if (professor == null || professor.Role != "Professor")
                throw new UnauthorizedAccessException("Usuário não é um professor válido");

            var materiaExiste = await _context.materias.AnyAsync(m => m.Id == dto.MateriaId);
            if (!materiaExiste)
                throw new ArgumentException("Matéria não encontrada");

            var atividade = new Atividades
            {
                Nome = dto.Nome,
                Descricao = dto.Descricao,
                MateriaId = dto.MateriaId,
                Tipo = dto.Tipo,
                NivelDificuldade = dto.NivelDificuldade,
                TotalQuestoes = dto.TotalQuestoes,
                Ativo = true,
                CriadoEm = DateTime.UtcNow
            };

            _context.Atividades.Add(atividade);
            await _context.SaveChangesAsync();

            var atribuicao = new AtividadeAtribuicao
            {
                AtividadeId = atividade.Id,
                ProfessorId = dto.ProfessorId,
                AlunoId = dto.AlunoId,
                EscolaId = dto.EscolaId,
                Prazo = dto.Prazo.HasValue ? DateTime.SpecifyKind(dto.Prazo.Value, DateTimeKind.Utc) : null,
                Instrucoes = dto.Instrucoes,
                Status = "Ativa",
                CriadoEm = DateTime.UtcNow
            };

            _context.AtividadeAtribuicoes.Add(atribuicao);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Professor {ProfessorId} criou atividade {AtividadeId} e atribuiu",
                dto.ProfessorId, atividade.Id);

            return await MapAtribuicaoDto(atribuicao.Id);
        }

        public async Task<AtribuicaoAtividadeDto> AtribuirAtividadeExistenteAsync(CriarAtribuicaoDto dto)
        {
            var professor = await _context.Users.FindAsync(dto.ProfessorId);
            if (professor == null || professor.Role != "Professor")
                throw new UnauthorizedAccessException("Usuário não é um professor válido");

            var atividade = await _context.Atividades.FindAsync(dto.AtividadeId);
            if (atividade == null)
                throw new ArgumentException("Atividade não encontrada");

            if (dto.AlunoId.HasValue)
            {
                var aluno = await _context.Users.FindAsync(dto.AlunoId.Value);
                if (aluno == null || aluno.Role != "Aluno")
                    throw new ArgumentException("Aluno não encontrado");
            }

            var atribuicao = new AtividadeAtribuicao
            {
                AtividadeId = dto.AtividadeId,
                ProfessorId = dto.ProfessorId,
                AlunoId = dto.AlunoId,
                EscolaId = dto.EscolaId,
                Prazo = dto.Prazo.HasValue ? DateTime.SpecifyKind(dto.Prazo.Value, DateTimeKind.Utc) : null,
                Instrucoes = dto.Instrucoes,
                Status = "Ativa",
                CriadoEm = DateTime.UtcNow
            };

            _context.AtividadeAtribuicoes.Add(atribuicao);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Professor {ProfessorId} atribuiu atividade {AtividadeId}",
                dto.ProfessorId, dto.AtividadeId);

            return await MapAtribuicaoDto(atribuicao.Id);
        }

        public async Task<List<AtribuicaoAtividadeDto>> ListarAtribuicoesProfessorAsync(int professorId)
        {
            return await _context.AtividadeAtribuicoes
                .Where(a => a.ProfessorId == professorId)
                .OrderByDescending(a => a.CriadoEm)
                .Select(a => new AtribuicaoAtividadeDto
                {
                    Id = a.Id,
                    AtividadeId = a.AtividadeId,
                    AtividadeNome = a.Atividade != null ? a.Atividade.Nome : "",
                    AtividadeTipo = a.Atividade != null ? a.Atividade.Tipo : "",
                    ProfessorId = a.ProfessorId,
                    ProfessorNome = a.Professor != null ? a.Professor.Nome : "",
                    AlunoId = a.AlunoId,
                    AlunoNome = a.Aluno != null ? a.Aluno.Nome : null,
                    EscolaId = a.EscolaId,
                    Prazo = a.Prazo,
                    Instrucoes = a.Instrucoes,
                    Status = a.Status,
                    CriadoEm = a.CriadoEm
                })
                .ToListAsync();
        }

        public async Task<List<AtribuicaoAtividadeDto>> ListarAtribuicoesEscolaAsync(int escolaId)
        {
            return await _context.AtividadeAtribuicoes
                .Where(a => a.EscolaId == escolaId)
                .OrderByDescending(a => a.CriadoEm)
                .Select(a => new AtribuicaoAtividadeDto
                {
                    Id = a.Id,
                    AtividadeId = a.AtividadeId,
                    AtividadeNome = a.Atividade != null ? a.Atividade.Nome : "",
                    AtividadeTipo = a.Atividade != null ? a.Atividade.Tipo : "",
                    ProfessorId = a.ProfessorId,
                    ProfessorNome = a.Professor != null ? a.Professor.Nome : "",
                    AlunoId = a.AlunoId,
                    AlunoNome = a.Aluno != null ? a.Aluno.Nome : null,
                    EscolaId = a.EscolaId,
                    Prazo = a.Prazo,
                    Instrucoes = a.Instrucoes,
                    Status = a.Status,
                    CriadoEm = a.CriadoEm
                })
                .ToListAsync();
        }

        public async Task<List<AtribuicaoAtividadeDto>> ListarAtribuicoesAlunoAsync(int alunoId, int escolaId)
        {
            return await _context.AtividadeAtribuicoes
                .Where(a => a.Status == "Ativa" && (a.AlunoId == alunoId || (a.AlunoId == null && a.EscolaId == escolaId)))
                .OrderByDescending(a => a.CriadoEm)
                .Select(a => new AtribuicaoAtividadeDto
                {
                    Id = a.Id,
                    AtividadeId = a.AtividadeId,
                    AtividadeNome = a.Atividade != null ? a.Atividade.Nome : "",
                    AtividadeTipo = a.Atividade != null ? a.Atividade.Tipo : "",
                    ProfessorId = a.ProfessorId,
                    ProfessorNome = a.Professor != null ? a.Professor.Nome : "",
                    AlunoId = a.AlunoId,
                    AlunoNome = a.Aluno != null ? a.Aluno.Nome : null,
                    EscolaId = a.EscolaId,
                    Prazo = a.Prazo,
                    Instrucoes = a.Instrucoes,
                    Status = a.Status,
                    CriadoEm = a.CriadoEm
                })
                .ToListAsync();
        }

        public async Task<bool> EncerrarAtribuicaoAsync(int atribuicaoId, int professorId)
        {
            var atribuicao = await _context.AtividadeAtribuicoes
                .FirstOrDefaultAsync(a => a.Id == atribuicaoId && a.ProfessorId == professorId);

            if (atribuicao == null)
                return false;

            atribuicao.Status = "Encerrada";
            atribuicao.AtualizadoEm = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }


        public async Task<List<RedacaoAlunoListDto>> ListarRedacoesAlunosAsync(int escolaId)
        {
            var alunoIds = await _context.Users
                .Where(u => u.id_Escola == escolaId && u.Role == "Aluno" && u.Ativo)
                .Select(u => u.Id)
                .ToListAsync();

            var redacoes = await _context.RedacaoCorrecoes
                .Where(r => alunoIds.Contains(r.UserId))
                .OrderByDescending(r => r.CriadoEm)
                .Select(r => new
                {
                    r.Id,
                    r.UserId,
                    AlunoNome = _context.Users
                        .Where(u => u.Id == r.UserId)
                        .Select(u => u.Nome)
                        .FirstOrDefault() ?? "",
                    r.Tema,
                    r.Status,
                    r.NotaTotal,
                    r.CriadoEm,
                    TemRevisao = _context.ProfessorRedacaoRevisoes
                        .Any(pr => pr.RedacaoCorrecaoId == r.Id),
                    NotaProfessor = _context.ProfessorRedacaoRevisoes
                        .Where(pr => pr.RedacaoCorrecaoId == r.Id)
                        .Select(pr => (decimal?)pr.NotaTotalProfessor)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return redacoes.Select(r => new RedacaoAlunoListDto
            {
                Id = r.Id,
                AlunoId = r.UserId,
                AlunoNome = r.AlunoNome,
                Tema = r.Tema ?? "Sem Tema",
                Status = r.Status,
                NotaTotal = r.NotaTotal,
                NotaProfessor = r.NotaProfessor,
                RevisadaPorProfessor = r.TemRevisao,
                DataEnvio = r.CriadoEm
            }).ToList();
        }

        public async Task<ProfessorRedacaoRevisaoDto> CriarRevisaoRedacaoAsync(CriarRevisaoRedacaoDto dto)
        {
            var professor = await _context.Users.FindAsync(dto.ProfessorId);
            if (professor == null || professor.Role != "Professor")
                throw new UnauthorizedAccessException("Usuário não é um professor válido");

            var redacao = await _context.RedacaoCorrecoes.FindAsync(dto.RedacaoCorrecaoId);
            if (redacao == null)
                throw new ArgumentException("Redação não encontrada");

            var revisaoExistente = await _context.ProfessorRedacaoRevisoes
                .FirstOrDefaultAsync(r => r.RedacaoCorrecaoId == dto.RedacaoCorrecaoId);
            if (revisaoExistente != null)
            {
                return await AtualizarRevisaoRedacaoAsync(revisaoExistente.Id, dto.ProfessorId, new AtualizarRevisaoRedacaoDto
                {
                    NotaTotalProfessor = dto.NotaTotalProfessor,
                    ComentarioGeral = dto.ComentarioGeral,
                    Competencias = dto.Competencias
                });
            }

            var revisao = new ProfessorRedacaoRevisao
            {
                RedacaoCorrecaoId = dto.RedacaoCorrecaoId,
                ProfessorId = dto.ProfessorId,
                NotaTotalProfessor = dto.NotaTotalProfessor,
                ComentarioGeral = dto.ComentarioGeral,
                CriadoEm = DateTime.UtcNow
            };

            _context.ProfessorRedacaoRevisoes.Add(revisao);
            await _context.SaveChangesAsync();

            if (dto.Competencias != null && dto.Competencias.Count > 0)
            {
                foreach (var comp in dto.Competencias)
                {
                    _context.ProfessorCompetenciaRevisoes.Add(new ProfessorCompetenciaRevisao
                    {
                        RevisaoId = revisao.Id,
                        NumeroCompetencia = comp.NumeroCompetencia,
                        NotaProfessor = comp.NotaProfessor,
                        ComentarioProfessor = comp.ComentarioProfessor,
                        CriadoEm = DateTime.UtcNow
                    });
                }
                await _context.SaveChangesAsync();
            }

            // Notificar aluno sobre a correção
            try
            {
                _context.Notificacoes.Add(new Notificacao
                {
                    UserId = redacao.UserId,
                    Mensagem = $"📝 Prof. {professor.Nome} corrigiu sua redação: {redacao.Tema}",
                    Tipo = "redacao",
                    ReferenciaId = redacao.Id,
                    ReferenciaTipo = "RedacaoCorrecao",
                    CriadoEm = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha ao criar notificação para redação {RedacaoId} (migração pendente?)", redacao.Id);
            }

            _logger.LogInformation("Professor {ProfessorId} criou revisão para redação {RedacaoId}",
                dto.ProfessorId, dto.RedacaoCorrecaoId);

            return await MapRevisaoDto(revisao.Id);
        }

        public async Task<ProfessorRedacaoRevisaoDto> AtualizarRevisaoRedacaoAsync(
            int revisaoId, int professorId, AtualizarRevisaoRedacaoDto dto)
        {
            var revisao = await _context.ProfessorRedacaoRevisoes
                .Include(r => r.CompetenciaRevisoes)
                .FirstOrDefaultAsync(r => r.Id == revisaoId && r.ProfessorId == professorId);

            if (revisao == null)
                throw new KeyNotFoundException("Revisão não encontrada");

            if (dto.NotaTotalProfessor.HasValue)
                revisao.NotaTotalProfessor = dto.NotaTotalProfessor.Value;

            if (dto.ComentarioGeral != null)
                revisao.ComentarioGeral = dto.ComentarioGeral;

            revisao.AtualizadoEm = DateTime.UtcNow;

            if (dto.Competencias != null && dto.Competencias.Count > 0)
            {
                if (revisao.CompetenciaRevisoes != null)
                {
                    _context.ProfessorCompetenciaRevisoes.RemoveRange(revisao.CompetenciaRevisoes);
                }

                foreach (var comp in dto.Competencias)
                {
                    _context.ProfessorCompetenciaRevisoes.Add(new ProfessorCompetenciaRevisao
                    {
                        RevisaoId = revisao.Id,
                        NumeroCompetencia = comp.NumeroCompetencia,
                        NotaProfessor = comp.NotaProfessor,
                        ComentarioProfessor = comp.ComentarioProfessor,
                        CriadoEm = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();

            // Notificar aluno sobre a atualização da correção
            try
            {
                var redacaoAtualizada = await _context.RedacaoCorrecoes.FindAsync(revisao.RedacaoCorrecaoId);
                var professorUser = await _context.Users.FindAsync(professorId);
                if (redacaoAtualizada != null && professorUser != null)
                {
                    _context.Notificacoes.Add(new Notificacao
                    {
                        UserId = redacaoAtualizada.UserId,
                        Mensagem = $"📝 Prof. {professorUser.Nome} atualizou a correção da sua redação: {redacaoAtualizada.Tema}",
                        Tipo = "redacao",
                        ReferenciaId = redacaoAtualizada.Id,
                        ReferenciaTipo = "RedacaoCorrecao",
                        CriadoEm = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha ao criar notificação de atualização para revisão {RevisaoId} (migração pendente?)", revisaoId);
            }

            _logger.LogInformation("Professor {ProfessorId} atualizou revisão {RevisaoId}",
                professorId, revisaoId);

            return await MapRevisaoDto(revisao.Id);
        }

        public async Task<ProfessorRedacaoRevisaoDto?> ObterRevisaoRedacaoAsync(int redacaoCorrecaoId)
        {
            var revisao = await _context.ProfessorRedacaoRevisoes
                .Where(r => r.RedacaoCorrecaoId == redacaoCorrecaoId)
                .Select(r => r.Id)
                .FirstOrDefaultAsync();

            if (revisao == 0)
                return null;

            return await MapRevisaoDto(revisao);
        }

        public async Task<List<GrifoDto>> SalvarGrifosAsync(SalvarGrifosDto dto)
        {
            var professor = await _context.Users.FindAsync(dto.ProfessorId);
            if (professor == null || professor.Role != "Professor")
                throw new UnauthorizedAccessException("Usuário não é um professor válido");

            var revisao = await _context.ProfessorRedacaoRevisoes
                .Include(r => r.Grifos)
                .FirstOrDefaultAsync(r => r.RedacaoCorrecaoId == dto.RedacaoCorrecaoId && r.ProfessorId == dto.ProfessorId);

            if (revisao == null)
                throw new KeyNotFoundException("Revisão não encontrada. Crie uma revisão antes de adicionar grifos.");

            if (revisao.Grifos != null && revisao.Grifos.Count > 0)
            {
                _context.ProfessorRedacaoGrifos.RemoveRange(revisao.Grifos);
            }

            foreach (var item in dto.Grifos)
            {
                _context.ProfessorRedacaoGrifos.Add(new ProfessorRedacaoGrifo
                {
                    RevisaoId = revisao.Id,
                    PosicaoInicio = item.PosicaoInicio,
                    PosicaoFim = item.PosicaoFim,
                    Cor = item.Cor,
                    Comentario = item.Comentario,
                    CriadoEm = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Professor {ProfessorId} salvou {Count} grifos para revisão {RevisaoId}",
                dto.ProfessorId, dto.Grifos.Count, revisao.Id);

            return await ObterGrifosAsync(dto.RedacaoCorrecaoId);
        }

        public async Task<List<GrifoDto>> ObterGrifosAsync(int redacaoCorrecaoId)
        {
            return await _context.ProfessorRedacaoGrifos
                .Where(g => g.Revisao!.RedacaoCorrecaoId == redacaoCorrecaoId)
                .OrderBy(g => g.PosicaoInicio)
                .Select(g => new GrifoDto
                {
                    Id = g.Id,
                    PosicaoInicio = g.PosicaoInicio,
                    PosicaoFim = g.PosicaoFim,
                    Cor = g.Cor,
                    Comentario = g.Comentario
                })
                .ToListAsync();
        }

        // ========== Atividade com IA (Professor) ==========

        public async Task<AtividadeComQuestoesDto> GerarAtividadeComIAAsync(GerarAtividadeProfessorDto dto)
        {
            var professor = await _context.Users.FindAsync(dto.ProfessorId);
            if (professor == null || professor.Role != "Professor")
                throw new UnauthorizedAccessException("Usuário não é um professor válido");

            var materia = await _context.materias.FindAsync(dto.MateriaId);
            if (materia == null)
                throw new ArgumentException("Matéria não encontrada");

            // Se tem MaterialId, criar atividade a partir das questões do material
            if (dto.MaterialId.HasValue && dto.MaterialId.Value > 0)
            {
                return await CriarAtividadeDoMaterialAsync(dto, materia, professor);
            }

            // Gerar questões com IA
            var prompt = $@"Gere {dto.TotalQuestoes} questões de múltipla escolha sobre {dto.Conteudo ?? dto.Nome} para {materia.Nome}.

CONFIGURAÇÃO:
- Nível de dificuldade: {dto.NivelDificuldade}
- Quantidade: {dto.TotalQuestoes} questões
- Descrição da atividade: {dto.Descricao ?? ""}

REGRAS OBRIGATÓRIAS:
1. Cada questão deve ter exatamente 4 alternativas (A, B, C, D)
2. Apenas UMA alternativa correta por questão
3. As alternativas incorretas devem ser plausíveis
4. Enunciados claros e objetivos
5. Contextualize com situações do cotidiano
6. Mantenha enunciados curtos (máx. 200 caracteres)
7. Mantenha alternativas curtas (máx. 100 caracteres)

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
  ]
}}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.";

            var maxTokens = Math.Clamp(dto.TotalQuestoes * 120 + 300, 800, 3000);

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(180));
            var respostaIA = await _deepSeekService.GerarAtividadeAsync(prompt, maxTokens, cts.Token);

            // Limpar resposta
            respostaIA = respostaIA.Trim();
            if (respostaIA.StartsWith("```json")) respostaIA = respostaIA[7..];
            else if (respostaIA.StartsWith("```")) respostaIA = respostaIA[3..];
            if (respostaIA.EndsWith("```")) respostaIA = respostaIA[..^3];
            respostaIA = respostaIA.Trim();

            int startIdx = respostaIA.IndexOf('{');
            int endIdx = respostaIA.LastIndexOf('}');
            if (startIdx >= 0 && endIdx > startIdx)
                respostaIA = respostaIA[startIdx..(endIdx + 1)];

            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                ReadCommentHandling = JsonCommentHandling.Skip,
                PropertyNameCaseInsensitive = true
            };

            var atividadeGerada = JsonSerializer.Deserialize<JsonElement>(respostaIA, options);

            // Processar questões e gabarito
            var questoes = new List<QuestaoEditadaDto>();
            var gabarito = new List<GabaritoItemDto>();

            var gabaritoOriginal = new Dictionary<int, string>();
            foreach (var g in atividadeGerada.GetProperty("gabarito").EnumerateArray())
            {
                var questaoNumero = g.TryGetProperty("questao", out var qp) && qp.ValueKind == JsonValueKind.Number ? qp.GetInt32() : 0;
                var resposta = g.TryGetProperty("respostaCorreta", out var rp) ? rp.GetString() : null;
                if (questaoNumero > 0 && !string.IsNullOrWhiteSpace(resposta))
                    gabaritoOriginal[questaoNumero] = resposta.Trim().ToUpperInvariant();
            }

            var questoesJson = atividadeGerada.GetProperty("questoes").EnumerateArray().ToList();
            for (int i = 0; i < questoesJson.Count; i++)
            {
                var q = questoesJson[i];
                var numero = i + 1;
                var alternativas = q.GetProperty("alternativas").EnumerateArray()
                    .Select((a, idx) => new AlternativaDto
                    {
                        Id = a.TryGetProperty("id", out var idProp) ? (idProp.GetString() ?? ((char)('A' + idx)).ToString()) : ((char)('A' + idx)).ToString(),
                        Texto = a.TryGetProperty("texto", out var tp) ? (tp.GetString() ?? "") : ""
                    }).ToList();

                questoes.Add(new QuestaoEditadaDto
                {
                    Numero = numero,
                    Enunciado = q.GetProperty("enunciado").GetString() ?? "",
                    Alternativas = alternativas,
                    RespostaCorreta = gabaritoOriginal.TryGetValue(numero, out var rc) ? rc : "A"
                });

                gabarito.Add(new GabaritoItemDto { Questao = numero, RespostaCorreta = gabaritoOriginal.TryGetValue(numero, out var gc) ? gc : "A" });
            }

            // Salvar atividade (rascunho, sem atribuição ainda)
            var atividade = new Atividades
            {
                Nome = dto.Nome,
                Descricao = dto.Descricao,
                MateriaId = dto.MateriaId,
                Tipo = dto.Tipo,
                NivelDificuldade = dto.NivelDificuldade,
                TotalQuestoes = questoes.Count,
                Ativo = false, // Rascunho até confirmar
                QuestoesJson = JsonSerializer.Serialize(questoes),
                GabaritoJson = JsonSerializer.Serialize(gabarito),
                CriadoEm = DateTime.UtcNow
            };

            _context.Atividades.Add(atividade);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Professor {ProfessorId} gerou atividade {AtividadeId} com {Count} questões via IA",
                dto.ProfessorId, atividade.Id, questoes.Count);

            return new AtividadeComQuestoesDto
            {
                Id = atividade.Id,
                Nome = atividade.Nome,
                Descricao = atividade.Descricao,
                Tipo = atividade.Tipo,
                NivelDificuldade = atividade.NivelDificuldade,
                TotalQuestoes = questoes.Count,
                MateriaNome = materia.Nome,
                MateriaId = atividade.MateriaId,
                Questoes = questoes,
                Gabarito = gabarito,
                CriadoEm = atividade.CriadoEm
            };
        }

        private async Task<AtividadeComQuestoesDto> CriarAtividadeDoMaterialAsync(
            GerarAtividadeProfessorDto dto, Materias materia, User professor)
        {
            var material = await _context.Materiais.FindAsync(dto.MaterialId!.Value);
            if (material == null || material.ProfessorId != dto.ProfessorId)
                throw new ArgumentException("Material não encontrado ou não pertence ao professor");

            if (string.IsNullOrWhiteSpace(material.QuestoesJson))
                throw new ArgumentException("Material não possui questões extraídas");

            var options = new JsonSerializerOptions
            {
                AllowTrailingCommas = true,
                PropertyNameCaseInsensitive = true
            };

            var parsed = JsonSerializer.Deserialize<JsonElement>(material.QuestoesJson, options);
            if (!parsed.TryGetProperty("questoes", out var questoesArray))
                throw new ArgumentException("Material não possui questões válidas");

            var questoesMaterial = questoesArray.EnumerateArray().ToList();
            var questoes = new List<QuestaoEditadaDto>();
            var gabarito = new List<GabaritoItemDto>();

            // Filtrar questões selecionadas ou pegar todas
            var selecionadas = dto.QuestoesSelecionadas ?? questoesMaterial
                .Select((_, i) => i + 1).ToList();

            int numero = 0;
            foreach (var idx in selecionadas)
            {
                if (idx < 1 || idx > questoesMaterial.Count) continue;
                var q = questoesMaterial[idx - 1];
                numero++;

                var alternativas = new List<AlternativaDto>();
                if (q.TryGetProperty("alternativas", out var alts))
                {
                    int altIdx = 0;
                    foreach (var a in alts.EnumerateArray())
                    {
                        var letra = a.TryGetProperty("letra", out var lp) ? lp.GetString() :
                                    a.TryGetProperty("id", out var ip) ? ip.GetString() :
                                    ((char)('A' + altIdx)).ToString();
                        var texto = a.TryGetProperty("texto", out var tp) ? tp.GetString() ?? "" : "";
                        alternativas.Add(new AlternativaDto { Id = letra ?? ((char)('A' + altIdx)).ToString(), Texto = texto });
                        altIdx++;
                    }
                }

                var gabaritoLetra = q.TryGetProperty("gabarito", out var gp) ? gp.GetString()?.Trim().ToUpperInvariant() ?? "A" : "A";

                questoes.Add(new QuestaoEditadaDto
                {
                    Numero = numero,
                    Enunciado = q.TryGetProperty("enunciado", out var ep) ? ep.GetString() ?? "" : "",
                    Alternativas = alternativas,
                    RespostaCorreta = gabaritoLetra
                });

                gabarito.Add(new GabaritoItemDto { Questao = numero, RespostaCorreta = gabaritoLetra });
            }

            if (questoes.Count == 0)
                throw new ArgumentException("Nenhuma questão válida selecionada");

            var atividade = new Atividades
            {
                Nome = dto.Nome,
                Descricao = dto.Descricao,
                MateriaId = dto.MateriaId,
                Tipo = dto.Tipo,
                NivelDificuldade = dto.NivelDificuldade,
                TotalQuestoes = questoes.Count,
                Ativo = false,
                QuestoesJson = JsonSerializer.Serialize(questoes),
                GabaritoJson = JsonSerializer.Serialize(gabarito),
                CriadoEm = DateTime.UtcNow
            };

            _context.Atividades.Add(atividade);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Professor {ProfessorId} criou atividade {AtividadeId} com {Count} questões do Material {MaterialId}",
                dto.ProfessorId, atividade.Id, questoes.Count, dto.MaterialId);

            return new AtividadeComQuestoesDto
            {
                Id = atividade.Id,
                Nome = atividade.Nome,
                Descricao = atividade.Descricao,
                Tipo = atividade.Tipo,
                NivelDificuldade = atividade.NivelDificuldade,
                TotalQuestoes = questoes.Count,
                MateriaNome = materia.Nome,
                MateriaId = atividade.MateriaId,
                Questoes = questoes,
                Gabarito = gabarito,
                CriadoEm = atividade.CriadoEm
            };
        }

        public async Task<List<AtividadeComQuestoesDto>> ListarRascunhosProfessorAsync(int professorId)
        {
            // Rascunhos: atividades com Ativo=false que não possuem atribuição ainda
            var atividadesComAtribuicao = await _context.AtividadeAtribuicoes
                .Where(a => a.ProfessorId == professorId)
                .Select(a => a.AtividadeId)
                .ToListAsync();

            var rascunhos = await _context.Atividades
                .Include(a => a.Materia)
                .Where(a => !a.Ativo && !atividadesComAtribuicao.Contains(a.Id) && a.QuestoesJson != null)
                .OrderByDescending(a => a.CriadoEm)
                .ToListAsync();

            return rascunhos.Select(a =>
            {
                var questoes = !string.IsNullOrEmpty(a.QuestoesJson)
                    ? JsonSerializer.Deserialize<List<QuestaoEditadaDto>>(a.QuestoesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new()
                    : new List<QuestaoEditadaDto>();
                var gabarito = !string.IsNullOrEmpty(a.GabaritoJson)
                    ? JsonSerializer.Deserialize<List<GabaritoItemDto>>(a.GabaritoJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new()
                    : new List<GabaritoItemDto>();
                return new AtividadeComQuestoesDto
                {
                    Id = a.Id,
                    Nome = a.Nome,
                    Descricao = a.Descricao,
                    Tipo = a.Tipo,
                    NivelDificuldade = a.NivelDificuldade,
                    TotalQuestoes = a.TotalQuestoes,
                    MateriaNome = a.Materia?.Nome ?? "",
                    MateriaId = a.MateriaId,
                    Questoes = questoes,
                    Gabarito = gabarito,
                    CriadoEm = a.CriadoEm
                };
            }).ToList();
        }

        public async Task<AtividadeComQuestoesDto> ObterAtividadeComQuestoesAsync(int atividadeId)
        {
            var atividade = await _context.Atividades
                .Include(a => a.Materia)
                .FirstOrDefaultAsync(a => a.Id == atividadeId);

            if (atividade == null)
                throw new KeyNotFoundException("Atividade não encontrada");

            var questoes = !string.IsNullOrEmpty(atividade.QuestoesJson)
                ? JsonSerializer.Deserialize<List<QuestaoEditadaDto>>(atividade.QuestoesJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new()
                : new List<QuestaoEditadaDto>();

            var gabarito = !string.IsNullOrEmpty(atividade.GabaritoJson)
                ? JsonSerializer.Deserialize<List<GabaritoItemDto>>(atividade.GabaritoJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new()
                : new List<GabaritoItemDto>();

            return new AtividadeComQuestoesDto
            {
                Id = atividade.Id,
                Nome = atividade.Nome,
                Descricao = atividade.Descricao,
                Tipo = atividade.Tipo,
                NivelDificuldade = atividade.NivelDificuldade,
                TotalQuestoes = atividade.TotalQuestoes,
                MateriaNome = atividade.Materia?.Nome ?? "",
                MateriaId = atividade.MateriaId,
                Questoes = questoes,
                Gabarito = gabarito,
                CriadoEm = atividade.CriadoEm
            };
        }

        public async Task<AtividadeComQuestoesDto> AtualizarQuestoesAsync(int atividadeId, int professorId, List<QuestaoEditadaDto> questoes)
        {
            var professor = await _context.Users.FindAsync(professorId);
            if (professor == null || professor.Role != "Professor")
                throw new UnauthorizedAccessException("Usuário não é um professor válido");

            var atividade = await _context.Atividades.FindAsync(atividadeId);
            if (atividade == null)
                throw new KeyNotFoundException("Atividade não encontrada");

            var gabarito = questoes.Select(q => new GabaritoItemDto
            {
                Questao = q.Numero,
                RespostaCorreta = q.RespostaCorreta
            }).ToList();

            atividade.QuestoesJson = JsonSerializer.Serialize(questoes);
            atividade.GabaritoJson = JsonSerializer.Serialize(gabarito);
            atividade.TotalQuestoes = questoes.Count;
            atividade.AtualizadoEm = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return await ObterAtividadeComQuestoesAsync(atividadeId);
        }

        public async Task<AtribuicaoAtividadeDto> ConfirmarEEnviarAtividadeAsync(ConfirmarAtividadeProfessorDto dto)
        {
            var professor = await _context.Users.FindAsync(dto.ProfessorId);
            if (professor == null || professor.Role != "Professor")
                throw new UnauthorizedAccessException("Usuário não é um professor válido");

            var atividade = await _context.Atividades.FindAsync(dto.AtividadeId);
            if (atividade == null)
                throw new KeyNotFoundException("Atividade não encontrada");

            // Se o professor editou questões, atualizar
            if (dto.QuestoesEditadas != null && dto.QuestoesEditadas.Count > 0)
            {
                var gabarito = dto.QuestoesEditadas.Select(q => new GabaritoItemDto
                {
                    Questao = q.Numero,
                    RespostaCorreta = q.RespostaCorreta
                }).ToList();

                atividade.QuestoesJson = JsonSerializer.Serialize(dto.QuestoesEditadas);
                atividade.GabaritoJson = JsonSerializer.Serialize(gabarito);
                atividade.TotalQuestoes = dto.QuestoesEditadas.Count;
            }

            atividade.Ativo = true;
            atividade.AtualizadoEm = DateTime.UtcNow;

            // Criar atribuição
            var atribuicao = new AtividadeAtribuicao
            {
                AtividadeId = atividade.Id,
                ProfessorId = dto.ProfessorId,
                AlunoId = dto.AlunoId,
                EscolaId = professor.id_Escola,
                Prazo = dto.Prazo.HasValue ? DateTime.SpecifyKind(dto.Prazo.Value, DateTimeKind.Utc) : null,
                Instrucoes = dto.Instrucoes,
                Status = "Ativa",
                CriadoEm = DateTime.UtcNow
            };

            _context.AtividadeAtribuicoes.Add(atribuicao);

            // Criar notificação para alunos
            if (dto.AlunoId.HasValue)
            {
                // Notificação para aluno específico
                _context.Notificacoes.Add(new Notificacao
                {
                    UserId = dto.AlunoId.Value,
                    Mensagem = $"📚 Prof. {professor.Nome} passou uma nova atividade: {atividade.Nome}",
                    Tipo = "atividade",
                    ReferenciaId = atividade.Id,
                    ReferenciaTipo = "AtividadeAtribuicao",
                    CriadoEm = DateTime.UtcNow
                });
            }
            else
            {
                // Notificação para todos os alunos da escola
                var alunoIds = await _context.Users
                    .Where(u => u.id_Escola == professor.id_Escola && u.Role == "Aluno" && u.Ativo)
                    .Select(u => u.Id)
                    .ToListAsync();

                foreach (var alunoId in alunoIds)
                {
                    _context.Notificacoes.Add(new Notificacao
                    {
                        UserId = alunoId,
                        Mensagem = $"📚 Prof. {professor.Nome} passou uma nova atividade: {atividade.Nome}",
                        Tipo = "atividade",
                        ReferenciaId = atividade.Id,
                        ReferenciaTipo = "AtividadeAtribuicao",
                        CriadoEm = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Professor {ProfessorId} confirmou e enviou atividade {AtividadeId}",
                dto.ProfessorId, atividade.Id);

            return await MapAtribuicaoDto(atribuicao.Id);
        }

        // ========== Notificações ==========

        public async Task<List<NotificacaoDto>> ListarNotificacoesAsync(int userId)
        {
            return await _context.Notificacoes
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CriadoEm)
                .Take(50)
                .Select(n => new NotificacaoDto
                {
                    Id = n.Id,
                    Mensagem = n.Mensagem,
                    Tipo = n.Tipo,
                    ReferenciaId = n.ReferenciaId,
                    ReferenciaTipo = n.ReferenciaTipo,
                    Lida = n.Lida,
                    CriadoEm = n.CriadoEm
                })
                .ToListAsync();
        }

        public async Task MarcarNotificacaoLidaAsync(int notificacaoId, int userId)
        {
            var notificacao = await _context.Notificacoes
                .FirstOrDefaultAsync(n => n.Id == notificacaoId && n.UserId == userId);
            if (notificacao != null)
            {
                notificacao.Lida = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarcarTodasLidasAsync(int userId)
        {
            var naoLidas = await _context.Notificacoes
                .Where(n => n.UserId == userId && !n.Lida)
                .ToListAsync();

            foreach (var n in naoLidas)
                n.Lida = true;

            await _context.SaveChangesAsync();
        }

        private async Task<AtribuicaoAtividadeDto> MapAtribuicaoDto(int atribuicaoId)
        {
            return await _context.AtividadeAtribuicoes
                .Where(a => a.Id == atribuicaoId)
                .Select(a => new AtribuicaoAtividadeDto
                {
                    Id = a.Id,
                    AtividadeId = a.AtividadeId,
                    AtividadeNome = a.Atividade != null ? a.Atividade.Nome : "",
                    AtividadeTipo = a.Atividade != null ? a.Atividade.Tipo : "",
                    ProfessorId = a.ProfessorId,
                    ProfessorNome = a.Professor != null ? a.Professor.Nome : "",
                    AlunoId = a.AlunoId,
                    AlunoNome = a.Aluno != null ? a.Aluno.Nome : null,
                    EscolaId = a.EscolaId,
                    Prazo = a.Prazo,
                    Instrucoes = a.Instrucoes,
                    Status = a.Status,
                    CriadoEm = a.CriadoEm
                })
                .FirstAsync();
        }

        private async Task<ProfessorRedacaoRevisaoDto> MapRevisaoDto(int revisaoId)
        {
            var revisao = await _context.ProfessorRedacaoRevisoes
                .Include(r => r.CompetenciaRevisoes)
                .Include(r => r.RedacaoCorrecao)
                .Include(r => r.Professor)
                .FirstAsync(r => r.Id == revisaoId);

            var alunoNome = revisao.RedacaoCorrecao != null
                ? await _context.Users
                    .Where(u => u.Id == revisao.RedacaoCorrecao.UserId)
                    .Select(u => u.Nome)
                    .FirstOrDefaultAsync()
                : null;

            return new ProfessorRedacaoRevisaoDto
            {
                Id = revisao.Id,
                RedacaoCorrecaoId = revisao.RedacaoCorrecaoId,
                Tema = revisao.RedacaoCorrecao?.Tema ?? "",
                AlunoNome = alunoNome,
                ProfessorId = revisao.ProfessorId,
                ProfessorNome = revisao.Professor?.Nome ?? "",
                NotaTotalProfessor = revisao.NotaTotalProfessor,
                ComentarioGeral = revisao.ComentarioGeral,
                CriadoEm = revisao.CriadoEm,
                AtualizadoEm = revisao.AtualizadoEm,
                Competencias = (revisao.CompetenciaRevisoes ?? new List<ProfessorCompetenciaRevisao>())
                    .OrderBy(c => c.NumeroCompetencia)
                    .Select(c => new ProfessorCompetenciaRevisaoDto
                    {
                        NumeroCompetencia = c.NumeroCompetencia,
                        NotaProfessor = c.NotaProfessor,
                        ComentarioProfessor = c.ComentarioProfessor
                    })
                    .ToList()
            };
        }

        // ========== Visualização de Execuções (Professor) ==========

        public async Task<List<ExecucaoAlunoResumoDto>> ListarExecucoesPorAtividadeAsync(int atividadeId, int professorId)
        {
            var professor = await _context.Users.FindAsync(professorId);
            if (professor == null || professor.Role != "Professor")
                throw new UnauthorizedAccessException("Usuário não é um professor válido");

            var atividade = await _context.Atividades.FindAsync(atividadeId);
            if (atividade == null)
                throw new KeyNotFoundException("Atividade não encontrada");

            // Log para diagnóstico
            var todasExecucoes = await _context.AtividadeExecucoes
                .Where(e => e.AtividadeId == atividadeId)
                .Select(e => new { e.Id, e.Status, e.UserId })
                .ToListAsync();
            
            System.Diagnostics.Debug.WriteLine($"[ListarExecucoes] AtividadeId={atividadeId}: {todasExecucoes.Count} execuções totais. Status: {string.Join(", ", todasExecucoes.Select(e => $"#{e.Id}='{e.Status}'"))}");
            Console.WriteLine($"[ListarExecucoes] AtividadeId={atividadeId}: {todasExecucoes.Count} execuções totais. Status: {string.Join(", ", todasExecucoes.Select(e => $"#{e.Id}='{e.Status}'"))}");

            return await _context.AtividadeExecucoes
                .Where(e => e.AtividadeId == atividadeId && (e.Status == "Concluída" || e.Status == "Concluida"))
                .OrderByDescending(e => e.DataFim)
                .Select(e => new ExecucaoAlunoResumoDto
                {
                    ExecucaoId = e.Id,
                    AlunoId = e.UserId,
                    AlunoNome = _context.Users.Where(u => u.Id == e.UserId).Select(u => u.Nome).FirstOrDefault() ?? "",
                    AtividadeId = e.AtividadeId,
                    AtividadeNome = atividade.Nome,
                    TotalQuestoes = e.TotalQuestoes,
                    Acertos = e.Acertos,
                    Erros = e.Erros,
                    Nota = e.Nota,
                    Status = e.Status,
                    DataFim = e.DataFim
                })
                .ToListAsync();
        }

        public async Task<ExecucaoDetalhadaDto> ObterExecucaoDetalhadaAsync(int execucaoId, int professorId)
        {
            var professor = await _context.Users.FindAsync(professorId);
            if (professor == null || professor.Role != "Professor")
                throw new UnauthorizedAccessException("Usuário não é um professor válido");

            var execucao = await _context.AtividadeExecucoes
                .Include(e => e.QuestaoResultados)
                .FirstOrDefaultAsync(e => e.Id == execucaoId);

            if (execucao == null)
                throw new KeyNotFoundException("Execução não encontrada");

            var aluno = await _context.Users.FindAsync(execucao.UserId);
            var atividade = await _context.Atividades.FindAsync(execucao.AtividadeId);

            // Tentar obter questões do JSON da atividade ou da execução
            List<QuestaoEditadaDto>? questoesDesserializadas = null;
            var questoesJsonSource = atividade?.QuestoesJson ?? execucao.QuestoesJson;
            if (!string.IsNullOrEmpty(questoesJsonSource))
            {
                try
                {
                    questoesDesserializadas = JsonSerializer.Deserialize<List<QuestaoEditadaDto>>(questoesJsonSource,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                }
                catch { /* ignora falha de deserialização */ }
            }

            var questoesDetalhes = new List<QuestaoResultadoDetalheDto>();

            if (execucao.QuestaoResultados != null && execucao.QuestaoResultados.Count > 0)
            {
                foreach (var qr in execucao.QuestaoResultados.OrderBy(q => q.NumeroQuestao))
                {
                    var questaoOriginal = questoesDesserializadas?.FirstOrDefault(q => q.Numero == qr.NumeroQuestao);
                    questoesDetalhes.Add(new QuestaoResultadoDetalheDto
                    {
                        NumeroQuestao = qr.NumeroQuestao,
                        Enunciado = questaoOriginal?.Enunciado,
                        RespostaAluno = qr.RespostaAluno,
                        RespostaCorreta = qr.RespostaCorreta,
                        Resultado = qr.Resultado,
                        Alternativas = questaoOriginal?.Alternativas
                    });
                }
            }
            else if (questoesDesserializadas != null)
            {
                // Fallback: montar a partir dos JSONs armazenados
                List<RespostaAlunoDto>? respostasDesserializadas = null;
                var respostasJsonSource = execucao.RespostasJson;
                if (!string.IsNullOrEmpty(respostasJsonSource))
                {
                    try
                    {
                        respostasDesserializadas = JsonSerializer.Deserialize<List<RespostaAlunoDto>>(respostasJsonSource,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    }
                    catch { /* ignora */ }
                }

                List<GabaritoItemDto>? gabaritoDesserializado = null;
                var gabaritoJsonSource = atividade?.GabaritoJson ?? execucao.GabaritoJson;
                if (!string.IsNullOrEmpty(gabaritoJsonSource))
                {
                    try
                    {
                        gabaritoDesserializado = JsonSerializer.Deserialize<List<GabaritoItemDto>>(gabaritoJsonSource,
                            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    }
                    catch { /* ignora */ }
                }

                foreach (var q in questoesDesserializadas)
                {
                    var respAluno = respostasDesserializadas?.FirstOrDefault(r => r.Questao == q.Numero)?.Resposta;
                    var gabItem = gabaritoDesserializado?.FirstOrDefault(g => g.Questao == q.Numero);
                    var acertou = gabItem != null && string.Equals(respAluno?.Trim(), gabItem.RespostaCorreta?.Trim(), StringComparison.OrdinalIgnoreCase);

                    questoesDetalhes.Add(new QuestaoResultadoDetalheDto
                    {
                        NumeroQuestao = q.Numero,
                        Enunciado = q.Enunciado,
                        RespostaAluno = respAluno,
                        RespostaCorreta = gabItem?.RespostaCorreta ?? q.RespostaCorreta,
                        Resultado = respAluno == null ? "Pulou" : (acertou ? "Acerto" : "Erro"),
                        Alternativas = q.Alternativas
                    });
                }
            }

            return new ExecucaoDetalhadaDto
            {
                ExecucaoId = execucao.Id,
                AlunoId = execucao.UserId,
                AlunoNome = aluno?.Nome ?? "",
                AtividadeId = execucao.AtividadeId,
                AtividadeNome = atividade?.Nome ?? "",
                TotalQuestoes = execucao.TotalQuestoes,
                Acertos = execucao.Acertos,
                Erros = execucao.Erros,
                Nota = execucao.Nota,
                Status = execucao.Status,
                DataFim = execucao.DataFim,
                Questoes = questoesDetalhes
            };
        }
    }
}
