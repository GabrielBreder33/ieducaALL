using ServiceIEDUCA.Models;

namespace ServiceIEDUCA.Services
{
    public interface IRedacaoCorrecaoService
    {
        Task<RedacaoCorrecoes> IniciarCorrecaoAsync(int userId, int? atividadeExecucaoId, string tema, string textoRedacao, string tipoAvaliacao);
        Task ProcessarCorrecaoAsync(int correcaoId);
        Task<RedacaoCorrecoes?> ObterCorrecaoAsync(int correcaoId);
        Task<List<RedacaoCorrecoes>> ObterCorrecoesUsuarioAsync(int userId);
        Task AtualizarProgressoAsync(int correcaoId, int progresso, string status);
    }
}
