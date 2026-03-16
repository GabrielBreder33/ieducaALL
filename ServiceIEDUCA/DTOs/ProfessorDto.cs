namespace ServiceIEDUCA.DTOs
{
    // ========== Atribuição de Atividades ==========

    public class AtribuicaoAtividadeDto
    {
        public int Id { get; set; }
        public int AtividadeId { get; set; }
        public string AtividadeNome { get; set; } = string.Empty;
        public string AtividadeTipo { get; set; } = string.Empty;
        public int ProfessorId { get; set; }
        public string ProfessorNome { get; set; } = string.Empty;
        public int? AlunoId { get; set; }
        public string? AlunoNome { get; set; }
        public int EscolaId { get; set; }
        public DateTime? Prazo { get; set; }
        public string? Instrucoes { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CriadoEm { get; set; }
    }

    public class CriarAtribuicaoDto
    {
        public int AtividadeId { get; set; }
        public int ProfessorId { get; set; }
        public int? AlunoId { get; set; }
        public int EscolaId { get; set; }
        public DateTime? Prazo { get; set; }
        public string? Instrucoes { get; set; }
    }

    public class CriarAtividadeProfessorDto
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int MateriaId { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string NivelDificuldade { get; set; } = string.Empty;
        public int TotalQuestoes { get; set; }
        public int ProfessorId { get; set; }
        public int EscolaId { get; set; }
        public int? AlunoId { get; set; }
        public DateTime? Prazo { get; set; }
        public string? Instrucoes { get; set; }
    }


    public class ProfessorRedacaoRevisaoDto
    {
        public int Id { get; set; }
        public int RedacaoCorrecaoId { get; set; }
        public string Tema { get; set; } = string.Empty;
        public string? AlunoNome { get; set; }
        public int ProfessorId { get; set; }
        public string ProfessorNome { get; set; } = string.Empty;
        public decimal NotaTotalProfessor { get; set; }
        public string? ComentarioGeral { get; set; }
        public DateTime CriadoEm { get; set; }
        public DateTime? AtualizadoEm { get; set; }
        public List<ProfessorCompetenciaRevisaoDto> Competencias { get; set; } = new();
    }

    public class ProfessorCompetenciaRevisaoDto
    {
        public int NumeroCompetencia { get; set; }
        public int NotaProfessor { get; set; }
        public string? ComentarioProfessor { get; set; }
    }

    public class CriarRevisaoRedacaoDto
    {
        public int RedacaoCorrecaoId { get; set; }
        public int ProfessorId { get; set; }
        public decimal NotaTotalProfessor { get; set; }
        public string? ComentarioGeral { get; set; }
        public List<CompetenciaRevisaoItemDto> Competencias { get; set; } = new();
    }

    public class AtualizarRevisaoRedacaoDto
    {
        public decimal? NotaTotalProfessor { get; set; }
        public string? ComentarioGeral { get; set; }
        public List<CompetenciaRevisaoItemDto>? Competencias { get; set; }
    }

    public class CompetenciaRevisaoItemDto
    {
        public int NumeroCompetencia { get; set; }
        public int NotaProfessor { get; set; }
        public string? ComentarioProfessor { get; set; }
    }


    public class RedacaoAlunoListDto
    {
        public int Id { get; set; }
        public int AlunoId { get; set; }
        public string AlunoNome { get; set; } = string.Empty;
        public string Tema { get; set; } = string.Empty;
        public string? Status { get; set; }
        public decimal NotaTotal { get; set; }
        public decimal? NotaProfessor { get; set; }
        public bool RevisadaPorProfessor { get; set; }
        public DateTime? DataEnvio { get; set; }
    }

    public class GrifoDto
    {
        public int Id { get; set; }
        public int PosicaoInicio { get; set; }
        public int PosicaoFim { get; set; }
        public string Cor { get; set; } = "yellow";
        public string? Comentario { get; set; }
    }

    public class SalvarGrifosDto
    {
        public int RedacaoCorrecaoId { get; set; }
        public int ProfessorId { get; set; }
        public List<GrifoItemDto> Grifos { get; set; } = new();
    }

    public class GrifoItemDto
    {
        public int PosicaoInicio { get; set; }
        public int PosicaoFim { get; set; }
        public string Cor { get; set; } = "yellow";
        public string? Comentario { get; set; }
    }


    // ========== Atividade com IA (Professor) ==========

    public class GerarAtividadeProfessorDto
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int MateriaId { get; set; }
        public string Tipo { get; set; } = "Quiz";
        public string NivelDificuldade { get; set; } = "Médio";
        public int TotalQuestoes { get; set; } = 10;
        public int ProfessorId { get; set; }
        public int EscolaId { get; set; }
        public string? Conteudo { get; set; } // Tema/conteúdo para gerar questões
    }

    public class ConfirmarAtividadeProfessorDto
    {
        public int AtividadeId { get; set; }
        public int ProfessorId { get; set; }
        public int? AlunoId { get; set; }
        public DateTime? Prazo { get; set; }
        public string? Instrucoes { get; set; }
        public List<QuestaoEditadaDto>? QuestoesEditadas { get; set; }
    }

    public class QuestaoEditadaDto
    {
        public int Numero { get; set; }
        public string Enunciado { get; set; } = string.Empty;
        public List<AlternativaDto> Alternativas { get; set; } = new();
        public string RespostaCorreta { get; set; } = "A";
    }

    public class AlternativaDto
    {
        public string Id { get; set; } = string.Empty;
        public string Texto { get; set; } = string.Empty;
    }

    public class AtividadeComQuestoesDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string NivelDificuldade { get; set; } = string.Empty;
        public int TotalQuestoes { get; set; }
        public string MateriaNome { get; set; } = string.Empty;
        public int MateriaId { get; set; }
        public List<QuestaoEditadaDto> Questoes { get; set; } = new();
        public List<GabaritoItemDto> Gabarito { get; set; } = new();
        public DateTime CriadoEm { get; set; }
    }

    public class GabaritoItemDto
    {
        public int Questao { get; set; }
        public string RespostaCorreta { get; set; } = string.Empty;
    }

    // ========== Notificações ==========

    public class NotificacaoDto
    {
        public int Id { get; set; }
        public string Mensagem { get; set; } = string.Empty;
        public string Tipo { get; set; } = "info";
        public int? ReferenciaId { get; set; }
        public string? ReferenciaTipo { get; set; }
        public bool Lida { get; set; }
        public DateTime CriadoEm { get; set; }
    }

    // ========== Execuções de Atividade (Visualização Professor) ==========

    public class ExecucaoAlunoResumoDto
    {
        public int ExecucaoId { get; set; }
        public int AlunoId { get; set; }
        public string AlunoNome { get; set; } = string.Empty;
        public int AtividadeId { get; set; }
        public string AtividadeNome { get; set; } = string.Empty;
        public int TotalQuestoes { get; set; }
        public int Acertos { get; set; }
        public int Erros { get; set; }
        public decimal? Nota { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? DataFim { get; set; }
    }

    public class ExecucaoDetalhadaDto
    {
        public int ExecucaoId { get; set; }
        public int AlunoId { get; set; }
        public string AlunoNome { get; set; } = string.Empty;
        public int AtividadeId { get; set; }
        public string AtividadeNome { get; set; } = string.Empty;
        public int TotalQuestoes { get; set; }
        public int Acertos { get; set; }
        public int Erros { get; set; }
        public decimal? Nota { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? DataFim { get; set; }
        public List<QuestaoResultadoDetalheDto> Questoes { get; set; } = new();
    }

    public class QuestaoResultadoDetalheDto
    {
        public int NumeroQuestao { get; set; }
        public string? Enunciado { get; set; }
        public string? RespostaAluno { get; set; }
        public string? RespostaCorreta { get; set; }
        public string Resultado { get; set; } = string.Empty;
        public List<AlternativaDto>? Alternativas { get; set; }
    }
}
