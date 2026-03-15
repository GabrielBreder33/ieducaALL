using ServiceIEDUCA.DTOs;

namespace ServiceIEDUCA.Services
{
    public interface IProfessorService
    {
        Task<AtribuicaoAtividadeDto> CriarAtividadeEAtribuirAsync(CriarAtividadeProfessorDto dto);
        Task<AtribuicaoAtividadeDto> AtribuirAtividadeExistenteAsync(CriarAtribuicaoDto dto);
        Task<List<AtribuicaoAtividadeDto>> ListarAtribuicoesProfessorAsync(int professorId);
        Task<List<AtribuicaoAtividadeDto>> ListarAtribuicoesEscolaAsync(int escolaId);
        Task<List<AtribuicaoAtividadeDto>> ListarAtribuicoesAlunoAsync(int alunoId, int escolaId);
        Task<bool> EncerrarAtribuicaoAsync(int atribuicaoId, int professorId);

        Task<List<RedacaoAlunoListDto>> ListarRedacoesAlunosAsync(int escolaId);
        Task<ProfessorRedacaoRevisaoDto> CriarRevisaoRedacaoAsync(CriarRevisaoRedacaoDto dto);
        Task<ProfessorRedacaoRevisaoDto> AtualizarRevisaoRedacaoAsync(int revisaoId, int professorId, AtualizarRevisaoRedacaoDto dto);
        Task<ProfessorRedacaoRevisaoDto?> ObterRevisaoRedacaoAsync(int redacaoCorrecaoId);

        Task<List<GrifoDto>> SalvarGrifosAsync(SalvarGrifosDto dto);
        Task<List<GrifoDto>> ObterGrifosAsync(int redacaoCorrecaoId);
    }
}
