using Microsoft.AspNetCore.Mvc;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Services;

namespace ServiceIEDUCA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RankingController : ControllerBase
    {
        private readonly IRankingService _rankingService;
        private readonly ILogger<RankingController> _logger;

        public RankingController(IRankingService rankingService, ILogger<RankingController> logger)
        {
            _rankingService = rankingService;
            _logger = logger;
        }

        [HttpGet("escola/{escolaId:int}")]
        public async Task<ActionResult<RankingResponseDto>> GetRankingPorEscola(
            int escolaId,
            [FromQuery] string periodo = "mensal")
        {
            if (escolaId <= 0)
            {
                return BadRequest("O identificador da escola precisa ser maior que zero.");
            }

            try
            {
                _logger.LogInformation(
                    "Buscando ranking | EscolaId: {EscolaId} | Periodo: {Periodo}",
                    escolaId,
                    periodo);

                var ranking = await _rankingService.ObterRankingPorEscolaAsync(escolaId, periodo);
                return Ok(ranking);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Erro ao buscar ranking da escola | EscolaId: {EscolaId} | Periodo: {Periodo}",
                    escolaId,
                    periodo);

                return StatusCode(500, "Erro interno ao gerar ranking");
            }
        }
    }
}
