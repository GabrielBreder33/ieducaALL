using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Models;

namespace ServiceIEDUCA.Services
{
    public class ProfessorService : IProfessorService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ProfessorService> _logger;

        public ProfessorService(AppDbContext context, ILogger<ProfessorService> logger)
        {
            _context = context;
            _logger = logger;
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
                .AnyAsync(r => r.RedacaoCorrecaoId == dto.RedacaoCorrecaoId);
            if (revisaoExistente)
                throw new InvalidOperationException("Esta redação já possui uma revisão do professor. Use o endpoint de atualização.");

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
    }
}
