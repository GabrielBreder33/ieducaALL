using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Models;

namespace ServiceIEDUCA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AtividadeExecucoesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AtividadeExecucoesController> _logger;

        public AtividadeExecucoesController(AppDbContext context, ILogger<AtividadeExecucoesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Frontend chama quando o aluno INICIA uma atividade
        [HttpPost("iniciar")]
        public async Task<ActionResult<AtividadeExecucaoDto>> IniciarAtividade([FromBody] AtividadeExecucaoCreateDto dto)
        {
            try
            {
                // Validações
                var userExiste = await _context.Users.AnyAsync(u => u.Id == dto.UserId);
                if (!userExiste)
                    return BadRequest("Usuário não encontrado");

                // Comentado: atividades são mockadas no frontend, não precisa validar
                // var atividadeExiste = await _context.Atividades.AnyAsync(a => a.Id == dto.AtividadeId);
                // if (!atividadeExiste)
                //     return BadRequest("Atividade não encontrada");

                var execucao = new AtividadeExecucoes
                {
                    UserId = dto.UserId,
                    AtividadeId = dto.AtividadeId,
                    DataInicio = DateTime.Now,
                    TotalQuestoes = dto.TotalQuestoes,
                    Acertos = 0,
                    Erros = 0,
                    Status = "Em Andamento",
                    CriadoEm = DateTime.Now
                };

                _context.AtividadeExecucoes.Add(execucao);
                await _context.SaveChangesAsync();

                // Buscar dados sem JOIN (para permitir atividades mockadas)
                var user = await _context.Users.FindAsync(execucao.UserId);
                
                var execucaoDto = new AtividadeExecucaoDto
                {
                    Id = execucao.Id,
                    UserId = execucao.UserId,
                    UserNome = user?.Nome ?? "",
                    AtividadeId = execucao.AtividadeId,
                    AtividadeNome = $"Atividade {execucao.AtividadeId}", // Mockado
                    DataInicio = execucao.DataInicio,
                    DataFim = execucao.DataFim,
                    TotalQuestoes = execucao.TotalQuestoes,
                    Acertos = execucao.Acertos,
                    Erros = execucao.Erros,
                    Nota = execucao.Nota,
                    TempoGastoSegundos = execucao.TempoGastoSegundos,
                    Status = execucao.Status,
                    CriadoEm = execucao.CriadoEm
                };

                return CreatedAtAction(nameof(GetById), new { id = execucao.Id }, execucaoDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao iniciar atividade");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // PUT: api/AtividadeExecucoes/{id}/finalizar
        // Frontend chama quando o aluno FINALIZA/COMPLETA a atividade
        [HttpPut("{id}/finalizar")]
        public async Task<ActionResult> FinalizarAtividade(int id, [FromBody] AtividadeExecucaoFinalizarDto dto)
        {
            try
            {
                var execucao = await _context.AtividadeExecucoes.FindAsync(id);
                if (execucao == null)
                    return NotFound($"Execução com ID {id} não encontrada");

                if (execucao.Status == "Concluída")
                    return BadRequest("Esta atividade já foi finalizada");

                // Atualizar dados da execução
                execucao.DataFim = DateTime.Now;
                execucao.Acertos = dto.Acertos;
                execucao.Erros = dto.Erros;
                execucao.Nota = dto.Nota;
                execucao.TempoGastoSegundos = dto.TempoGastoSegundos;
                execucao.Status = "Concluída";

                // Salvar resultados detalhados das questões (opcional)
                if (dto.QuestoesResultados != null && dto.QuestoesResultados.Any())
                {
                    foreach (var questao in dto.QuestoesResultados)
                    {
                        var questaoResultado = new AtividadeQuestaoResultados
                        {
                            ExecucaoId = id,
                            NumeroQuestao = questao.NumeroQuestao,
                            Resultado = questao.Resultado,
                            RespostaAluno = questao.RespostaAluno,
                            RespostaCorreta = questao.RespostaCorreta,
                            TempoGastoSegundos = questao.TempoGastoSegundos,
                            TopicoEspecifico = questao.TopicoEspecifico,
                            CriadoEm = DateTime.Now
                        };

                        _context.AtividadeQuestaoResultados.Add(questaoResultado);
                    }
                }

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao finalizar atividade {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/AtividadeExecucoes/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<AtividadeExecucaoDto>> GetById(int id)
        {
            try
            {
                var execucao = await _context.AtividadeExecucoes.FindAsync(id);
                
                if (execucao == null)
                    return NotFound($"Execução com ID {id} não encontrada");

                var user = await _context.Users.FindAsync(execucao.UserId);
                
                var execucaoDto = new AtividadeExecucaoDto
                {
                    Id = execucao.Id,
                    UserId = execucao.UserId,
                    UserNome = user?.Nome ?? "",
                    AtividadeId = execucao.AtividadeId,
                    AtividadeNome = $"Atividade {execucao.AtividadeId}",
                    DataInicio = execucao.DataInicio,
                    DataFim = execucao.DataFim,
                    TotalQuestoes = execucao.TotalQuestoes,
                    Acertos = execucao.Acertos,
                    Erros = execucao.Erros,
                    Nota = execucao.Nota,
                    TempoGastoSegundos = execucao.TempoGastoSegundos,
                    Status = execucao.Status,
                    CriadoEm = execucao.CriadoEm
                };

                return Ok(execucaoDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar execução {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/AtividadeExecucoes/usuario/{userId}
        // Histórico completo do aluno
        [HttpGet("usuario/{userId}")]
        public async Task<ActionResult<IEnumerable<AtividadeExecucaoDto>>> GetByUsuario(int userId)
        {
            try
            {
                var execucoes = await _context.AtividadeExecucoes
                    .Where(e => e.UserId == userId)
                    .OrderByDescending(e => e.CriadoEm)
                    .ToListAsync();

                var user = await _context.Users.FindAsync(userId);
                
                var execucoesDto = execucoes.Select(e => new AtividadeExecucaoDto
                {
                    Id = e.Id,
                    UserId = e.UserId,
                    UserNome = user?.Nome ?? "",
                    AtividadeId = e.AtividadeId,
                    AtividadeNome = $"Atividade {e.AtividadeId}",
                    DataInicio = e.DataInicio,
                    DataFim = e.DataFim,
                    TotalQuestoes = e.TotalQuestoes,
                    Acertos = e.Acertos,
                    Erros = e.Erros,
                    Nota = e.Nota,
                    TempoGastoSegundos = e.TempoGastoSegundos,
                    Status = e.Status,
                    CriadoEm = e.CriadoEm
                }).ToList();

                return Ok(execucoesDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar execuções do usuário {UserId}", userId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/AtividadeExecucoes/usuario/{userId}/atividade/{atividadeId}
        // Histórico de uma atividade específica de um aluno
        [HttpGet("usuario/{userId}/atividade/{atividadeId}")]
        public async Task<ActionResult<IEnumerable<AtividadeExecucaoDto>>> GetByUsuarioEAtividade(int userId, int atividadeId)
        {
            try
            {
                var execucoes = await _context.AtividadeExecucoes
                    .Include(e => e.User)
                    .Include(e => e.Atividade)
                    .Where(e => e.UserId == userId && e.AtividadeId == atividadeId)
                    .OrderByDescending(e => e.CriadoEm)
                    .Select(e => new AtividadeExecucaoDto
                    {
                        Id = e.Id,
                        UserId = e.UserId,
                        UserNome = e.User != null ? e.User.Nome : "",
                        AtividadeId = e.AtividadeId,
                        AtividadeNome = e.Atividade != null ? e.Atividade.Nome : "",
                        DataInicio = e.DataInicio,
                        DataFim = e.DataFim,
                        TotalQuestoes = e.TotalQuestoes,
                        Acertos = e.Acertos,
                        Erros = e.Erros,
                        Nota = e.Nota,
                        TempoGastoSegundos = e.TempoGastoSegundos,
                        Status = e.Status,
                        CriadoEm = e.CriadoEm
                    })
                    .ToListAsync();

                return Ok(execucoes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar execuções");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/AtividadeExecucoes/atividade/{atividadeId}
        // Todas execuções de uma atividade (para relatórios)
        [HttpGet("atividade/{atividadeId}")]
        public async Task<ActionResult<IEnumerable<AtividadeExecucaoDto>>> GetByAtividade(int atividadeId)
        {
            try
            {
                var execucoes = await _context.AtividadeExecucoes
                    .Include(e => e.User)
                    .Include(e => e.Atividade)
                    .Where(e => e.AtividadeId == atividadeId)
                    .OrderByDescending(e => e.CriadoEm)
                    .Select(e => new AtividadeExecucaoDto
                    {
                        Id = e.Id,
                        UserId = e.UserId,
                        UserNome = e.User != null ? e.User.Nome : "",
                        AtividadeId = e.AtividadeId,
                        AtividadeNome = e.Atividade != null ? e.Atividade.Nome : "",
                        DataInicio = e.DataInicio,
                        DataFim = e.DataFim,
                        TotalQuestoes = e.TotalQuestoes,
                        Acertos = e.Acertos,
                        Erros = e.Erros,
                        Nota = e.Nota,
                        TempoGastoSegundos = e.TempoGastoSegundos,
                        Status = e.Status,
                        CriadoEm = e.CriadoEm
                    })
                    .ToListAsync();

                return Ok(execucoes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar execuções da atividade {AtividadeId}", atividadeId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/AtividadeExecucoes/usuario/{userId}/estatisticas
        // Estatísticas do aluno para dashboard
        [HttpGet("usuario/{userId}/estatisticas")]
        public async Task<ActionResult> GetEstatisticasUsuario(int userId)
        {
            try
            {
                var execucoes = await _context.AtividadeExecucoes
                    .Where(e => e.UserId == userId && e.Status == "Concluída")
                    .OrderBy(e => e.DataFim)
                    .ToListAsync();

                if (!execucoes.Any())
                {
                    return Ok(new
                    {
                        totalAtividades = 0,
                        acertos = 0,
                        erros = 0,
                        mediaNotas = 0.0,
                        tempoTotalSegundos = 0,
                        ultimasAtividades = new List<object>()
                    });
                }

                var totalAcertos = execucoes.Sum(e => e.Acertos);
                var totalErros = execucoes.Sum(e => e.Erros);
                var mediaNotas = execucoes.Where(e => e.Nota.HasValue).Any() 
                    ? (double)execucoes.Where(e => e.Nota.HasValue).Average(e => e.Nota ?? 0) 
                    : 0.0;
                var tempoTotal = execucoes.Where(e => e.TempoGastoSegundos.HasValue)
                    .Sum(e => e.TempoGastoSegundos ?? 0);

                var ultimasAtividades = execucoes
                    .OrderByDescending(e => e.DataFim)
                    .Take(10)
                    .Select(e => new
                    {
                        data = e.DataFim ?? e.DataInicio,
                        nota = e.Nota ?? 0,
                        acertos = e.Acertos,
                        erros = e.Erros
                    })
                    .ToList();

                var estatisticas = new
                {
                    totalAtividades = execucoes.Count,
                    acertos = totalAcertos,
                    erros = totalErros,
                    mediaNotas = Math.Round(mediaNotas, 1),
                    tempoTotalSegundos = tempoTotal,
                    ultimasAtividades = ultimasAtividades
                };

                return Ok(estatisticas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar estatísticas do usuário {UserId}", userId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/AtividadeExecucoes/{id}/questoes
        // Detalhes das questões de uma execução
        [HttpGet("{id}/questoes")]
        public async Task<ActionResult> GetQuestoesPorExecucao(int id)
        {
            try
            {
                var questoes = await _context.AtividadeQuestaoResultados
                    .Where(q => q.ExecucaoId == id)
                    .OrderBy(q => q.NumeroQuestao)
                    .Select(q => new QuestaoResultadoDto
                    {
                        NumeroQuestao = q.NumeroQuestao,
                        Resultado = q.Resultado,
                        RespostaAluno = q.RespostaAluno,
                        RespostaCorreta = q.RespostaCorreta,
                        TempoGastoSegundos = q.TempoGastoSegundos,
                        TopicoEspecifico = q.TopicoEspecifico
                    })
                    .ToListAsync();

                return Ok(questoes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar questões da execução {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // DELETE: api/AtividadeExecucoes/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var execucao = await _context.AtividadeExecucoes.FindAsync(id);
                if (execucao == null)
                    return NotFound($"Execução com ID {id} não encontrada");

                _context.AtividadeExecucoes.Remove(execucao);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao deletar execução {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/AtividadeExecucoes/escola/{escolaId}/estatisticas
        [HttpGet("escola/{escolaId}/estatisticas")]
        public async Task<ActionResult> GetEstatisticasEscola(int escolaId)
        {
            try
            {
                // Buscar todos os alunos da escola
                var alunosIds = await _context.Users
                    .Where(u => u.id_Escola == escolaId && u.Ativo)
                    .Select(u => u.Id)
                    .ToListAsync();

                if (!alunosIds.Any())
                {
                    return Ok(new
                    {
                        totalHorasEstudadas = 0,
                        totalAtividades = 0,
                        mediaAcertos = 0.0,
                        totalQuestoesRespondidas = 0,
                        totalAlunos = 0,
                        atividadesPorMes = new int[6],
                        horasPorMes = new double[6]
                    });
                }

                // Buscar todas as execuções dos alunos da escola
                var execucoes = await _context.AtividadeExecucoes
                    .Where(e => alunosIds.Contains(e.UserId) && e.Status == "Concluída")
                    .ToListAsync();

                // Calcular estatísticas
                var totalSegundos = execucoes.Sum(e => e.TempoGastoSegundos ?? 0);
                var totalHoras = Math.Round(totalSegundos / 3600.0, 1);
                var totalAtividades = execucoes.Count;
                var totalQuestoes = execucoes.Sum(e => e.TotalQuestoes);
                var totalAcertos = execucoes.Sum(e => e.Acertos);
                var mediaAcertos = totalQuestoes > 0 ? Math.Round((totalAcertos / (double)totalQuestoes) * 100, 1) : 0;

                // Estatísticas por mês (últimos 6 meses)
                var dataLimite = DateTime.Now.AddMonths(-6);
                var execucoesPorMes = execucoes
                    .Where(e => e.DataFim.HasValue && e.DataFim.Value >= dataLimite)
                    .GroupBy(e => new { Ano = e.DataFim!.Value.Year, Mes = e.DataFim!.Value.Month })
                    .Select(g => new
                    {
                        Ano = g.Key.Ano,
                        Mes = g.Key.Mes,
                        Quantidade = g.Count(),
                        Horas = Math.Round(g.Sum(e => e.TempoGastoSegundos ?? 0) / 3600.0, 1)
                    })
                    .OrderBy(x => x.Ano)
                    .ThenBy(x => x.Mes)
                    .ToList();

                // Criar arrays para os últimos 6 meses
                var atividadesPorMes = new int[6];
                var horasPorMes = new double[6];
                
                for (int i = 0; i < 6; i++)
                {
                    var data = DateTime.Now.AddMonths(-5 + i);
                    var estatistica = execucoesPorMes.FirstOrDefault(e => e.Ano == data.Year && e.Mes == data.Month);
                    atividadesPorMes[i] = estatistica?.Quantidade ?? 0;
                    horasPorMes[i] = estatistica?.Horas ?? 0;
                }

                var resultado = new
                {
                    totalHorasEstudadas = totalHoras,
                    totalAtividades = totalAtividades,
                    mediaAcertos = mediaAcertos,
                    totalQuestoesRespondidas = totalQuestoes,
                    totalAlunos = alunosIds.Count,
                    atividadesPorMes = atividadesPorMes,
                    horasPorMes = horasPorMes
                };

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar estatísticas da escola {EscolaId}", escolaId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }
    }
}
