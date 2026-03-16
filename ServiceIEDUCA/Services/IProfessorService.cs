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

        // Atividade com IA (Professor)
        Task<AtividadeComQuestoesDto> GerarAtividadeComIAAsync(GerarAtividadeProfessorDto dto);
        Task<List<AtividadeComQuestoesDto>> ListarRascunhosProfessorAsync(int professorId);
        Task<AtividadeComQuestoesDto> ObterAtividadeComQuestoesAsync(int atividadeId);
        Task<AtividadeComQuestoesDto> AtualizarQuestoesAsync(int atividadeId, int professorId, List<QuestaoEditadaDto> questoes);
        Task<AtribuicaoAtividadeDto> ConfirmarEEnviarAtividadeAsync(ConfirmarAtividadeProfessorDto dto);

        // Notificações
        Task<List<NotificacaoDto>> ListarNotificacoesAsync(int userId);
        Task MarcarNotificacaoLidaAsync(int notificacaoId, int userId);
        Task MarcarTodasLidasAsync(int userId);

        Task<List<RedacaoAlunoListDto>> ListarRedacoesAlunosAsync(int escolaId);
        Task<ProfessorRedacaoRevisaoDto> CriarRevisaoRedacaoAsync(CriarRevisaoRedacaoDto dto);
        Task<ProfessorRedacaoRevisaoDto> AtualizarRevisaoRedacaoAsync(int revisaoId, int professorId, AtualizarRevisaoRedacaoDto dto);
        Task<ProfessorRedacaoRevisaoDto?> ObterRevisaoRedacaoAsync(int redacaoCorrecaoId);

        Task<List<GrifoDto>> SalvarGrifosAsync(SalvarGrifosDto dto);
        Task<List<GrifoDto>> ObterGrifosAsync(int redacaoCorrecaoId);

        // Visualização de execuções (Professor)
        Task<List<ExecucaoAlunoResumoDto>> ListarExecucoesPorAtividadeAsync(int atividadeId, int professorId);
        Task<ExecucaoDetalhadaDto> ObterExecucaoDetalhadaAsync(int execucaoId, int professorId);
    }
}
