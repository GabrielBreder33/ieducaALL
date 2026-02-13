using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Models;

namespace ServiceIEDUCA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AtividadesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AtividadesController> _logger;

        public AtividadesController(AppDbContext context, ILogger<AtividadesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AtividadeDto>>> GetAll()
        {
            try
            {
                var atividades = await _context.Atividades
                    .Include(a => a.Materia)
                    .Where(a => a.Ativo)
                    .OrderByDescending(a => a.CriadoEm)
                    .Select(a => new AtividadeDto
                    {
                        Id = a.Id,
                        Nome = a.Nome,
                        Descricao = a.Descricao,
                        MateriaId = a.MateriaId,
                        MateriaNome = a.Materia != null ? a.Materia.Nome : "",
                        Tipo = a.Tipo,
                        NivelDificuldade = a.NivelDificuldade,
                        TotalQuestoes = a.TotalQuestoes,
                        Ativo = a.Ativo,
                        CriadoEm = a.CriadoEm
                    })
                    .ToListAsync();

                return Ok(atividades);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar atividades");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/Atividades/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<AtividadeDto>> GetById(int id)
        {
            try
            {
                var atividade = await _context.Atividades
                    .Include(a => a.Materia)
                    .Where(a => a.Id == id)
                    .Select(a => new AtividadeDto
                    {
                        Id = a.Id,
                        Nome = a.Nome,
                        Descricao = a.Descricao,
                        MateriaId = a.MateriaId,
                        MateriaNome = a.Materia != null ? a.Materia.Nome : "",
                        Tipo = a.Tipo,
                        NivelDificuldade = a.NivelDificuldade,
                        TotalQuestoes = a.TotalQuestoes,
                        Ativo = a.Ativo,
                        CriadoEm = a.CriadoEm
                    })
                    .FirstOrDefaultAsync();

                if (atividade == null)
                    return NotFound($"Atividade com ID {id} não encontrada");

                return Ok(atividade);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar atividade {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/Atividades/materia/{materiaId}
        [HttpGet("materia/{materiaId}")]
        public async Task<ActionResult<IEnumerable<AtividadeDto>>> GetByMateria(int materiaId)
        {
            try
            {
                var atividades = await _context.Atividades
                    .Include(a => a.Materia)
                    .Where(a => a.MateriaId == materiaId && a.Ativo)
                    .OrderByDescending(a => a.CriadoEm)
                    .Select(a => new AtividadeDto
                    {
                        Id = a.Id,
                        Nome = a.Nome,
                        Descricao = a.Descricao,
                        MateriaId = a.MateriaId,
                        MateriaNome = a.Materia != null ? a.Materia.Nome : "",
                        Tipo = a.Tipo,
                        NivelDificuldade = a.NivelDificuldade,
                        TotalQuestoes = a.TotalQuestoes,
                        Ativo = a.Ativo,
                        CriadoEm = a.CriadoEm
                    })
                    .ToListAsync();

                return Ok(atividades);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar atividades da matéria {MateriaId}", materiaId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/Atividades/tipo/{tipo}
        [HttpGet("tipo/{tipo}")]
        public async Task<ActionResult<IEnumerable<AtividadeDto>>> GetByTipo(string tipo)
        {
            try
            {
                var atividades = await _context.Atividades
                    .Include(a => a.Materia)
                    .Where(a => a.Tipo == tipo && a.Ativo)
                    .OrderByDescending(a => a.CriadoEm)
                    .Select(a => new AtividadeDto
                    {
                        Id = a.Id,
                        Nome = a.Nome,
                        Descricao = a.Descricao,
                        MateriaId = a.MateriaId,
                        MateriaNome = a.Materia != null ? a.Materia.Nome : "",
                        Tipo = a.Tipo,
                        NivelDificuldade = a.NivelDificuldade,
                        TotalQuestoes = a.TotalQuestoes,
                        Ativo = a.Ativo,
                        CriadoEm = a.CriadoEm
                    })
                    .ToListAsync();

                return Ok(atividades);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar atividades do tipo {Tipo}", tipo);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // POST: api/Atividades
        [HttpPost]
        public async Task<ActionResult<AtividadeDto>> Create([FromBody] AtividadeCreateDto dto)
        {
            try
            {
                // Validar se matéria existe
                var materiaExiste = await _context.materias.AnyAsync(m => m.Id == dto.MateriaId);
                if (!materiaExiste)
                    return BadRequest("Matéria não encontrada");

                var atividade = new Atividades
                {
                    Nome = dto.Nome,
                    Descricao = dto.Descricao,
                    MateriaId = dto.MateriaId,
                    Tipo = dto.Tipo,
                    NivelDificuldade = dto.NivelDificuldade,
                    TotalQuestoes = dto.TotalQuestoes,
                    Ativo = true,
                    CriadoEm = DateTime.Now
                };

                _context.Atividades.Add(atividade);
                await _context.SaveChangesAsync();

                var atividadeDto = await _context.Atividades
                    .Include(a => a.Materia)
                    .Where(a => a.Id == atividade.Id)
                    .Select(a => new AtividadeDto
                    {
                        Id = a.Id,
                        Nome = a.Nome,
                        Descricao = a.Descricao,
                        MateriaId = a.MateriaId,
                        MateriaNome = a.Materia != null ? a.Materia.Nome : "",
                        Tipo = a.Tipo,
                        NivelDificuldade = a.NivelDificuldade,
                        TotalQuestoes = a.TotalQuestoes,
                        Ativo = a.Ativo,
                        CriadoEm = a.CriadoEm
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetById), new { id = atividade.Id }, atividadeDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar atividade");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // PUT: api/Atividades/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] AtividadeUpdateDto dto)
        {
            try
            {
                var atividade = await _context.Atividades.FindAsync(id);
                if (atividade == null)
                    return NotFound($"Atividade com ID {id} não encontrada");

                if (!string.IsNullOrEmpty(dto.Nome))
                    atividade.Nome = dto.Nome;

                if (dto.Descricao != null)
                    atividade.Descricao = dto.Descricao;

                if (!string.IsNullOrEmpty(dto.Tipo))
                    atividade.Tipo = dto.Tipo;

                if (!string.IsNullOrEmpty(dto.NivelDificuldade))
                    atividade.NivelDificuldade = dto.NivelDificuldade;

                if (dto.TotalQuestoes.HasValue)
                    atividade.TotalQuestoes = dto.TotalQuestoes.Value;

                if (dto.Ativo.HasValue)
                    atividade.Ativo = dto.Ativo.Value;

                atividade.AtualizadoEm = DateTime.Now;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar atividade {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // DELETE: api/Atividades/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var atividade = await _context.Atividades.FindAsync(id);
                if (atividade == null)
                    return NotFound($"Atividade com ID {id} não encontrada");

                // Soft delete
                atividade.Ativo = false;
                atividade.AtualizadoEm = DateTime.Now;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao deletar atividade {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }
    }
}
