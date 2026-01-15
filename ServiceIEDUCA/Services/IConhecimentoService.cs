using ServiceIEDUCA.DTOs;
using System.Collections.Generic;

namespace ServiceIEDUCA.Services
{
    public interface IConhecimentoService
    {
        Task<IEnumerable<ConhecimentoDto>> GetAllConhecimento();
        Task<ConhecimentoDto?> GetConhecimentoByIdAsync(int id);
        Task<ConhecimentoDto> CreateConhecimentoAsync(ConhecimentoDto conhecimentoDto);
        Task<ConhecimentoDto?> UpdateConhecimentoAsync(int id, ConhecimentoDto conhecimentoDto);
        Task<bool> DeleteConhecimentoAsync(int id);
        Task<IEnumerable<MateriasDto>> GetMateriasByConhecimentoIdAsync(int conhecimentoId);
    }
}