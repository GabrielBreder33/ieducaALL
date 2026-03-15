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
    public class MateriasController : ControllerBase
    {
        private readonly IConhecimentoService _conhecimentoService;
        private readonly AppDbContext _context;

        public MateriasController(IConhecimentoService conhecimentoService, AppDbContext context)
        {
            _conhecimentoService = conhecimentoService;
            _context = context;
        }

        // GET api/materias/by-conhecimento/5
        [HttpGet("by-conhecimento/{conhecimentoId}")]
        public async Task<ActionResult<IEnumerable<MateriasDto>>> GetByConhecimento(int conhecimentoId)
        {
            var list = await _conhecimentoService.GetMateriasByConhecimentoIdAsync(conhecimentoId);
            return Ok(list);
        }

        // Optional: allow query by area_id as query string: GET api/materias?area_id=5
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MateriasDto>>> GetByArea([FromQuery(Name = "area_id")] int? areaId)
        {
            if (!areaId.HasValue)
                return BadRequest("Query parameter 'area_id' is required.");

            var list = await _conhecimentoService.GetMateriasByConhecimentoIdAsync(areaId.Value);
            return Ok(list);
        }

        [HttpPost]
        public async Task<ActionResult<MateriasDto>> Create([FromBody] MateriasDto dto)
        {
            var materia = new Materias
            {
                Nome = dto.Nome,
                area_id = dto.area_id
            };
            _context.materias.Add(materia);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetByConhecimento), new { conhecimentoId = materia.area_id }, new MateriasDto
            {
                Id = materia.Id,
                Nome = materia.Nome,
                area_id = materia.area_id
            });
        }
    }
}
