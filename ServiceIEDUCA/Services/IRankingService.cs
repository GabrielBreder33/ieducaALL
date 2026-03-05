using ServiceIEDUCA.DTOs;

namespace ServiceIEDUCA.Services
{
    public interface IRankingService
    {
        Task<RankingResponseDto> ObterRankingPorEscolaAsync(int escolaId, string periodo);
    }
}
