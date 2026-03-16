using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Services;

namespace ServiceIEDUCA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfessorController : ControllerBase
    {
        private readonly IProfessorService _professorService;
        private readonly ILogger<ProfessorController> _logger;
        private readonly AppDbContext _context;

        public ProfessorController(IProfessorService professorService, ILogger<ProfessorController> logger, AppDbContext context)
        {
            _professorService = professorService;
            _logger = logger;
            _context = context;
        }

        [HttpPost("atividades")]
        public async Task<ActionResult<AtribuicaoAtividadeDto>> CriarAtividade([FromBody] CriarAtividadeProfessorDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Nome))
                    return BadRequest(new { message = "Nome da atividade é obrigatório" });

                if (dto.ProfessorId <= 0)
                    return BadRequest(new { message = "ProfessorId inválido" });

                var resultado = await _professorService.CriarAtividadeEAtribuirAsync(dto);
                return CreatedAtAction(nameof(ListarAtribuicoesProfessor),
                    new { professorId = dto.ProfessorId }, resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar atividade do professor");
                return StatusCode(500, new { message = "Erro ao criar atividade" });
            }
        }

        [HttpPost("atividades/atribuir")]
        public async Task<ActionResult<AtribuicaoAtividadeDto>> AtribuirAtividade([FromBody] CriarAtribuicaoDto dto)
        {
            try
            {
                if (dto.AtividadeId <= 0)
                    return BadRequest(new { message = "AtividadeId inválido" });

                if (dto.ProfessorId <= 0)
                    return BadRequest(new { message = "ProfessorId inválido" });

                var resultado = await _professorService.AtribuirAtividadeExistenteAsync(dto);
                return Ok(resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atribuir atividade");
                return StatusCode(500, new { message = "Erro ao atribuir atividade" });
            }
        }

        [HttpGet("atividades/professor/{professorId}")]
        public async Task<ActionResult<List<AtribuicaoAtividadeDto>>> ListarAtribuicoesProfessor(int professorId)
        {
            try
            {
                var resultado = await _professorService.ListarAtribuicoesProfessorAsync(professorId);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar atribuições do professor {ProfessorId}", professorId);
                return StatusCode(500, new { message = "Erro ao listar atribuições" });
            }
        }

        [HttpGet("atividades/rascunhos/{professorId}")]
        public async Task<ActionResult<List<AtividadeComQuestoesDto>>> ListarRascunhos(int professorId)
        {
            try
            {
                var resultado = await _professorService.ListarRascunhosProfessorAsync(professorId);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar rascunhos do professor {ProfessorId}", professorId);
                return StatusCode(500, new { message = "Erro ao listar rascunhos" });
            }
        }

        [HttpGet("atividades/escola/{escolaId}")]
        public async Task<ActionResult<List<AtribuicaoAtividadeDto>>> ListarAtribuicoesEscola(int escolaId)
        {
            try
            {
                var resultado = await _professorService.ListarAtribuicoesEscolaAsync(escolaId);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar atribuições da escola {EscolaId}", escolaId);
                return StatusCode(500, new { message = "Erro ao listar atribuições" });
            }
        }

        [HttpGet("atividades/aluno/{alunoId}")]
        public async Task<ActionResult<List<AtribuicaoAtividadeDto>>> ListarAtribuicoesAluno(int alunoId, [FromQuery] int escolaId)
        {
            try
            {
                var resultado = await _professorService.ListarAtribuicoesAlunoAsync(alunoId, escolaId);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar atribuições do aluno {AlunoId}", alunoId);
                return StatusCode(500, new { message = "Erro ao listar atribuições" });
            }
        }

        [HttpPut("atividades/{atribuicaoId}/encerrar")]
        public async Task<ActionResult> EncerrarAtribuicao(int atribuicaoId, [FromQuery] int professorId)
        {
            try
            {
                var sucesso = await _professorService.EncerrarAtribuicaoAsync(atribuicaoId, professorId);
                if (!sucesso)
                    return NotFound(new { message = "Atribuição não encontrada" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao encerrar atribuição {AtribuicaoId}", atribuicaoId);
                return StatusCode(500, new { message = "Erro ao encerrar atribuição" });
            }
        }

        [HttpGet("redacoes/escola/{escolaId}")]
        public async Task<ActionResult<List<RedacaoAlunoListDto>>> ListarRedacoesAlunos(int escolaId)
        {
            try
            {
                var resultado = await _professorService.ListarRedacoesAlunosAsync(escolaId);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar redações da escola {EscolaId}", escolaId);
                return StatusCode(500, new { message = "Erro ao listar redações" });
            }
        }

        [HttpPost("redacoes/revisao")]
        public async Task<ActionResult<ProfessorRedacaoRevisaoDto>> CriarRevisaoRedacao([FromBody] CriarRevisaoRedacaoDto dto)
        {
            try
            {
                if (dto.RedacaoCorrecaoId <= 0)
                    return BadRequest(new { message = "RedacaoCorrecaoId inválido" });

                if (dto.ProfessorId <= 0)
                    return BadRequest(new { message = "ProfessorId inválido" });

                var resultado = await _professorService.CriarRevisaoRedacaoAsync(dto);
                return CreatedAtAction(nameof(ObterRevisaoRedacao),
                    new { redacaoCorrecaoId = dto.RedacaoCorrecaoId }, resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar revisão de redação");
                return StatusCode(500, new { message = "Erro ao criar revisão" });
            }
        }

        [HttpPut("redacoes/revisao/{revisaoId}")]
        public async Task<ActionResult<ProfessorRedacaoRevisaoDto>> AtualizarRevisaoRedacao(
            int revisaoId, [FromQuery] int professorId, [FromBody] AtualizarRevisaoRedacaoDto dto)
        {
            try
            {
                var resultado = await _professorService.AtualizarRevisaoRedacaoAsync(revisaoId, professorId, dto);
                return Ok(resultado);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Revisão não encontrada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar revisão {RevisaoId}", revisaoId);
                return StatusCode(500, new { message = "Erro ao atualizar revisão" });
            }
        }

        [HttpGet("redacoes/revisao/{redacaoCorrecaoId}")]
        public async Task<ActionResult<ProfessorRedacaoRevisaoDto>> ObterRevisaoRedacao(int redacaoCorrecaoId)
        {
            try
            {
                var resultado = await _professorService.ObterRevisaoRedacaoAsync(redacaoCorrecaoId);
                if (resultado == null)
                    return NotFound(new { message = "Nenhuma revisão encontrada para esta redação" });

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao obter revisão da redação {RedacaoId}", redacaoCorrecaoId);
                return StatusCode(500, new { message = "Erro ao obter revisão" });
            }
        }

        [HttpPut("redacoes/grifos")]
        public async Task<ActionResult<List<GrifoDto>>> SalvarGrifos([FromBody] SalvarGrifosDto dto)
        {
            try
            {
                if (dto.RedacaoCorrecaoId <= 0)
                    return BadRequest(new { message = "RedacaoCorrecaoId inválido" });

                if (dto.ProfessorId <= 0)
                    return BadRequest(new { message = "ProfessorId inválido" });

                var resultado = await _professorService.SalvarGrifosAsync(dto);
                return Ok(resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao salvar grifos");
                return StatusCode(500, new { message = "Erro ao salvar grifos" });
            }
        }

        [HttpGet("redacoes/grifos/{redacaoCorrecaoId}")]
        public async Task<ActionResult<List<GrifoDto>>> ObterGrifos(int redacaoCorrecaoId)
        {
            try
            {
                var resultado = await _professorService.ObterGrifosAsync(redacaoCorrecaoId);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao obter grifos da redação {RedacaoId}", redacaoCorrecaoId);
                return StatusCode(500, new { message = "Erro ao obter grifos" });
            }
        }

        // ========== Atividade com IA (Professor) ==========

        [HttpPost("atividades/gerar-ia")]
        public async Task<ActionResult<AtividadeComQuestoesDto>> GerarAtividadeComIA([FromBody] GerarAtividadeProfessorDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Nome))
                    return BadRequest(new { message = "Nome da atividade é obrigatório" });
                if (dto.ProfessorId <= 0)
                    return BadRequest(new { message = "ProfessorId inválido" });
                if (dto.MateriaId <= 0)
                    return BadRequest(new { message = "MateriaId inválido" });

                var resultado = await _professorService.GerarAtividadeComIAAsync(dto);
                return Ok(resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao gerar atividade com IA");
                return StatusCode(500, new { message = "Erro ao gerar atividade com IA" });
            }
        }

        [HttpGet("atividades/{atividadeId}/questoes")]
        public async Task<ActionResult<AtividadeComQuestoesDto>> ObterAtividadeComQuestoes(int atividadeId)
        {
            try
            {
                var resultado = await _professorService.ObterAtividadeComQuestoesAsync(atividadeId);
                return Ok(resultado);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Atividade não encontrada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao obter atividade {AtividadeId}", atividadeId);
                return StatusCode(500, new { message = "Erro ao obter atividade" });
            }
        }

        [HttpPut("atividades/{atividadeId}/questoes")]
        public async Task<ActionResult<AtividadeComQuestoesDto>> AtualizarQuestoes(
            int atividadeId, [FromQuery] int professorId, [FromBody] List<QuestaoEditadaDto> questoes)
        {
            try
            {
                var resultado = await _professorService.AtualizarQuestoesAsync(atividadeId, professorId, questoes);
                return Ok(resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Atividade não encontrada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar questões {AtividadeId}", atividadeId);
                return StatusCode(500, new { message = "Erro ao atualizar questões" });
            }
        }

        [HttpPost("atividades/confirmar")]
        public async Task<ActionResult<AtribuicaoAtividadeDto>> ConfirmarEEnviarAtividade([FromBody] ConfirmarAtividadeProfessorDto dto)
        {
            try
            {
                if (dto.AtividadeId <= 0)
                    return BadRequest(new { message = "AtividadeId inválido" });
                if (dto.ProfessorId <= 0)
                    return BadRequest(new { message = "ProfessorId inválido" });

                var resultado = await _professorService.ConfirmarEEnviarAtividadeAsync(dto);
                return Ok(resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao confirmar e enviar atividade");
                return StatusCode(500, new { message = "Erro ao confirmar atividade" });
            }
        }

        // ========== Notificações ==========

        [HttpGet("notificacoes/{userId}")]
        public async Task<ActionResult<List<NotificacaoDto>>> ListarNotificacoes(int userId)
        {
            try
            {
                var resultado = await _professorService.ListarNotificacoesAsync(userId);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar notificações do usuário {UserId}", userId);
                return StatusCode(500, new { message = "Erro ao listar notificações" });
            }
        }

        [HttpPut("notificacoes/{notificacaoId}/lida")]
        public async Task<ActionResult> MarcarNotificacaoLida(int notificacaoId, [FromQuery] int userId)
        {
            try
            {
                await _professorService.MarcarNotificacaoLidaAsync(notificacaoId, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao marcar notificação como lida");
                return StatusCode(500, new { message = "Erro ao marcar notificação" });
            }
        }

        [HttpPut("notificacoes/marcar-todas/{userId}")]
        public async Task<ActionResult> MarcarTodasLidas(int userId)
        {
            try
            {
                await _professorService.MarcarTodasLidasAsync(userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao marcar todas notificações como lidas");
                return StatusCode(500, new { message = "Erro ao marcar notificações" });
            }
        }

        // ========== Visualização de Execuções ==========

        // DIAGNÓSTICO TEMPORÁRIO - remover depois
        [HttpGet("atividades/{atividadeId}/debug-execucoes")]
        public async Task<ActionResult> DebugExecucoes(int atividadeId)
        {
            var atividade = await _context.Atividades.FindAsync(atividadeId);
            var todasExecucoes = await _context.AtividadeExecucoes
                .Where(e => e.AtividadeId == atividadeId)
                .Select(e => new { e.Id, e.UserId, e.AtividadeId, e.Status, e.Acertos, e.TotalQuestoes, e.Nota, e.DataFim })
                .ToListAsync();
            
            var todasExecucoesGeral = await _context.AtividadeExecucoes
                .OrderByDescending(e => e.Id)
                .Take(20)
                .Select(e => new { e.Id, e.UserId, e.AtividadeId, e.Status, e.Nota, e.DataFim })
                .ToListAsync();

            return Ok(new {
                atividadeIdBuscado = atividadeId,
                atividadeExiste = atividade != null,
                atividadeNome = atividade?.Nome,
                execucoesParaEstaAtividade = todasExecucoes,
                ultimasExecucoesGeral = todasExecucoesGeral
            });
        }

        [HttpGet("atividades/{atividadeId}/execucoes")]
        public async Task<ActionResult<List<ExecucaoAlunoResumoDto>>> ListarExecucoes(int atividadeId, [FromQuery] int professorId)
        {
            try
            {
                _logger.LogInformation("📊 ListarExecucoes chamado: atividadeId={AtividadeId}, professorId={ProfessorId}", atividadeId, professorId);
                var resultado = await _professorService.ListarExecucoesPorAtividadeAsync(atividadeId, professorId);
                _logger.LogInformation("📊 ListarExecucoes resultado: {Count} execuções encontradas", resultado.Count);
                return Ok(resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Atividade não encontrada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar execuções da atividade {AtividadeId}", atividadeId);
                return StatusCode(500, new { message = "Erro ao listar execuções" });
            }
        }

        [HttpGet("atividades/execucao/{execucaoId}/detalhes")]
        public async Task<ActionResult<ExecucaoDetalhadaDto>> ObterExecucaoDetalhada(int execucaoId, [FromQuery] int professorId)
        {
            try
            {
                var resultado = await _professorService.ObterExecucaoDetalhadaAsync(execucaoId, professorId);
                return Ok(resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Execução não encontrada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao obter detalhes da execução {ExecucaoId}", execucaoId);
                return StatusCode(500, new { message = "Erro ao obter detalhes" });
            }
        }
    }
}
