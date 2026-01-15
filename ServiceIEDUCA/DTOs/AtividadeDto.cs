namespace ServiceIEDUCA.DTOs
{
    public class AtividadeDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int MateriaId { get; set; }
        public string MateriaNome { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public string NivelDificuldade { get; set; } = string.Empty;
        public int TotalQuestoes { get; set; }
        public bool Ativo { get; set; }
        public DateTime CriadoEm { get; set; }
    }

    public class AtividadeCreateDto
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int MateriaId { get; set; }
        public string Tipo { get; set; } = string.Empty; // Quiz, Redação, Simulado
        public string NivelDificuldade { get; set; } = string.Empty; // Fácil, Médio, Difícil
        public int TotalQuestoes { get; set; }
    }

    public class AtividadeUpdateDto
    {
        public string? Nome { get; set; }
        public string? Descricao { get; set; }
        public string? Tipo { get; set; }
        public string? NivelDificuldade { get; set; }
        public int? TotalQuestoes { get; set; }
        public bool? Ativo { get; set; }
    }
}
