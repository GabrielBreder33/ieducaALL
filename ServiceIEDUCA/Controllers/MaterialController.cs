using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Models;
using ServiceIEDUCA.Services;

namespace ServiceIEDUCA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MaterialController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IMaterialService _materialService;
        private readonly ILogger<MaterialController> _logger;

        private static readonly string[] AllowedExtensions = { ".pdf" };
        private const long MaxFileSize = 1L * 1024 * 1024 * 1024; // 1GB

        public MaterialController(
            AppDbContext context,
            IMaterialService materialService,
            ILogger<MaterialController> logger)
        {
            _context = context;
            _materialService = materialService;
            _logger = logger;
        }

        // GET: api/Material/professor/{professorId}
        [HttpGet("professor/{professorId}")]
        public async Task<ActionResult<IEnumerable<MaterialDto>>> GetByProfessor(int professorId)
        {
            try
            {
                var materiais = await _context.Materiais
                    .Include(m => m.Professor)
                    .Include(m => m.Materia)
                    .Where(m => m.ProfessorId == professorId && m.Ativo)
                    .OrderByDescending(m => m.CriadoEm)
                    .Select(m => new MaterialDto
                    {
                        Id = m.Id,
                        ProfessorId = m.ProfessorId,
                        ProfessorNome = m.Professor != null ? m.Professor.Nome : "",
                        Nome = m.Nome,
                        Descricao = m.Descricao,
                        MateriaId = m.MateriaId,
                        MateriaNome = m.Materia != null ? m.Materia.Nome : null,
                        Tipo = m.Tipo,
                        QuestoesJson = m.QuestoesJson,
                        TotalQuestoes = m.TotalQuestoes,
                        Status = m.Status,
                        ErroProcessamento = m.ErroProcessamento,
                        Ativo = m.Ativo,
                        CriadoEm = m.CriadoEm
                    })
                    .ToListAsync();

                return Ok(materiais);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar materiais do professor {ProfessorId}", professorId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/Material/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MaterialDto>> GetById(int id)
        {
            try
            {
                var material = await _context.Materiais
                    .Include(m => m.Professor)
                    .Include(m => m.Materia)
                    .Where(m => m.Id == id)
                    .Select(m => new MaterialDto
                    {
                        Id = m.Id,
                        ProfessorId = m.ProfessorId,
                        ProfessorNome = m.Professor != null ? m.Professor.Nome : "",
                        Nome = m.Nome,
                        Descricao = m.Descricao,
                        MateriaId = m.MateriaId,
                        MateriaNome = m.Materia != null ? m.Materia.Nome : null,
                        Tipo = m.Tipo,
                        QuestoesJson = m.QuestoesJson,
                        TotalQuestoes = m.TotalQuestoes,
                        Status = m.Status,
                        ErroProcessamento = m.ErroProcessamento,
                        Ativo = m.Ativo,
                        CriadoEm = m.CriadoEm
                    })
                    .FirstOrDefaultAsync();

                if (material == null)
                    return NotFound($"Material com ID {id} não encontrado");

                return Ok(material);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar material {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // POST: api/Material/upload
        [HttpPost("upload")]
        [RequestSizeLimit(MaxFileSize)]
        public async Task<ActionResult<MaterialDto>> Upload([FromForm] MaterialUploadDto dto)
        {
            try
            {
                if (dto.Arquivo == null || dto.Arquivo.Length == 0)
                    return BadRequest("Nenhum arquivo enviado");

                var extension = Path.GetExtension(dto.Arquivo.FileName).ToLowerInvariant();
                if (!AllowedExtensions.Contains(extension))
                    return BadRequest("Apenas arquivos PDF são permitidos");

                if (dto.Arquivo.Length > MaxFileSize)
                    return BadRequest("Arquivo muito grande. Máximo 10MB");

                // Validar professor existe
                var professorExiste = await _context.Users.AnyAsync(u => u.Id == dto.ProfessorId && u.Role == "Professor");
                if (!professorExiste)
                    return BadRequest("Professor não encontrado");

                using var stream = dto.Arquivo.OpenReadStream();

                var material = await _materialService.ProcessarPdfAsync(
                    stream,
                    dto.Arquivo.FileName,
                    dto.ProfessorId,
                    dto.Nome,
                    dto.Descricao,
                    dto.MateriaId
                );

                var result = await _context.Materiais
                    .Include(m => m.Professor)
                    .Include(m => m.Materia)
                    .Where(m => m.Id == material.Id)
                    .Select(m => new MaterialDto
                    {
                        Id = m.Id,
                        ProfessorId = m.ProfessorId,
                        ProfessorNome = m.Professor != null ? m.Professor.Nome : "",
                        Nome = m.Nome,
                        Descricao = m.Descricao,
                        MateriaId = m.MateriaId,
                        MateriaNome = m.Materia != null ? m.Materia.Nome : null,
                        Tipo = m.Tipo,
                        QuestoesJson = m.QuestoesJson,
                        TotalQuestoes = m.TotalQuestoes,
                        Status = m.Status,
                        ErroProcessamento = m.ErroProcessamento,
                        Ativo = m.Ativo,
                        CriadoEm = m.CriadoEm
                    })
                    .FirstAsync();

                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao fazer upload de material");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // PUT: api/Material/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] MaterialUpdateDto dto)
        {
            try
            {
                var material = await _context.Materiais.FindAsync(id);
                if (material == null)
                    return NotFound($"Material com ID {id} não encontrado");

                if (dto.Nome != null) material.Nome = dto.Nome;
                if (dto.Descricao != null) material.Descricao = dto.Descricao;
                if (dto.MateriaId.HasValue) material.MateriaId = dto.MateriaId;
                if (dto.Ativo.HasValue) material.Ativo = dto.Ativo.Value;

                material.AtualizadoEm = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar material {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // DELETE: api/Material/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var material = await _context.Materiais.FindAsync(id);
                if (material == null)
                    return NotFound($"Material com ID {id} não encontrado");

                material.Ativo = false;
                material.AtualizadoEm = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao deletar material {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // POST: api/Material/{id}/reprocessar
        [HttpPost("{id}/reprocessar")]
        public async Task<ActionResult<MaterialDto>> Reprocessar(int id)
        {
            try
            {
                var material = await _context.Materiais.FindAsync(id);
                if (material == null)
                    return NotFound($"Material com ID {id} não encontrado");

                if (string.IsNullOrWhiteSpace(material.ConteudoTexto))
                    return BadRequest("Material não possui texto extraído para reprocessar");

                material.Status = "Processando";
                material.ErroProcessamento = null;
                await _context.SaveChangesAsync();

                try
                {
                    var questoesJson = await _materialService.ExtrairQuestoesComIAAsync(material.ConteudoTexto);
                    material.QuestoesJson = questoesJson;

                    var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var parsed = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(questoesJson, options);
                    if (parsed.TryGetProperty("questoes", out var questoesArray) ||
                        parsed.TryGetProperty("Questoes", out questoesArray))
                    {
                        material.TotalQuestoes = questoesArray.GetArrayLength();
                    }

                    material.Status = "Concluido";
                }
                catch (Exception ex)
                {
                    material.Status = "Erro";
                    material.ErroProcessamento = ex.Message;
                }

                material.AtualizadoEm = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var result = await _context.Materiais
                    .Include(m => m.Professor)
                    .Include(m => m.Materia)
                    .Where(m => m.Id == material.Id)
                    .Select(m => new MaterialDto
                    {
                        Id = m.Id,
                        ProfessorId = m.ProfessorId,
                        ProfessorNome = m.Professor != null ? m.Professor.Nome : "",
                        Nome = m.Nome,
                        Descricao = m.Descricao,
                        MateriaId = m.MateriaId,
                        MateriaNome = m.Materia != null ? m.Materia.Nome : null,
                        Tipo = m.Tipo,
                        QuestoesJson = m.QuestoesJson,
                        TotalQuestoes = m.TotalQuestoes,
                        Status = m.Status,
                        ErroProcessamento = m.ErroProcessamento,
                        Ativo = m.Ativo,
                        CriadoEm = m.CriadoEm
                    })
                    .FirstAsync();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao reprocessar material {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }
    }
}
