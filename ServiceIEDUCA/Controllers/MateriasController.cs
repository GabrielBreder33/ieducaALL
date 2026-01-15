using Microsoft.AspNetCore.Mvc;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Services;

namespace ServiceIEDUCA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MateriasController : ControllerBase
    {
        private readonly IConhecimentoService _conhecimentoService;

        public MateriasController(IConhecimentoService conhecimentoService)
        {
            _conhecimentoService = conhecimentoService;
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
    }
}
