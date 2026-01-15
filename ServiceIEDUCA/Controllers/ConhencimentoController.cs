using Microsoft.AspNetCore.Mvc;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Services;

namespace ServiceIEDUCA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConhencimentoController : ControllerBase
    {
        private readonly IConhecimentoService _conhecimentoService;

        public ConhencimentoController(IConhecimentoService conhecimentoService)
        {
            _conhecimentoService = conhecimentoService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ConhecimentoDto>>> GetAll()
        {
            var list = await _conhecimentoService.GetAllConhecimento();
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ConhecimentoDto>> GetById(int id)
        {
            var conhecimento = await _conhecimentoService.GetConhecimentoByIdAsync(id);
            if (conhecimento == null) return NotFound();
            return Ok(conhecimento);
        }

        [HttpGet("{id}/materias")]
        public async Task<ActionResult<IEnumerable<MateriasDto>>> GetMateriasByConhecimento(int id)
        {
            var list = await _conhecimentoService.GetMateriasByConhecimentoIdAsync(id);
            return Ok(list);
        }

        [HttpPost]
        public async Task<ActionResult<ConhecimentoDto>> Create([FromBody] ConhecimentoDto dto)
        {
            var created = await _conhecimentoService.CreateConhecimentoAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ConhecimentoDto>> Update(int id, [FromBody] ConhecimentoDto dto)
        {
            var updated = await _conhecimentoService.UpdateConhecimentoAsync(id, dto);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _conhecimentoService.DeleteConhecimentoAsync(id);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}
