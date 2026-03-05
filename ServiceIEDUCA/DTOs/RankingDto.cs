namespace ServiceIEDUCA.DTOs
{
    public class RankingAlunoDto
    {
        public int Posicao { get; set; }
        public int UserId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public int EscolaId { get; set; }
        public string? EscolaNome { get; set; }
        public decimal MediaRedacao { get; set; }
        public decimal MediaAtividades { get; set; }
        public decimal MediaAtividadesRaw { get; set; }
        public decimal MediaFinal { get; set; }
        public int TotalRedacoes { get; set; }
        public int TotalAtividades { get; set; }
        public DateTime? UltimaAtualizacao { get; set; }
    }

    public class RankingResponseDto
    {
        public string Periodo { get; set; } = "mensal";
        public DateTime DataInicio { get; set; }
        public DateTime DataFim { get; set; }
        public int EscolaId { get; set; }
        public string? EscolaNome { get; set; }
        public List<RankingAlunoDto> Alunos { get; set; } = new();
    }
}
