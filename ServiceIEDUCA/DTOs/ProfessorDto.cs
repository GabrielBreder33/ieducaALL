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
}
