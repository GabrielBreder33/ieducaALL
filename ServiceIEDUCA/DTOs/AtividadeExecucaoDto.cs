namespace ServiceIEDUCA.DTOs
{
    public class AtividadeExecucaoDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserNome { get; set; } = string.Empty;
        public int AtividadeId { get; set; }
        public string AtividadeNome { get; set; } = string.Empty;
        public DateTime DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
        public int TotalQuestoes { get; set; }
        public int Acertos { get; set; }
        public int Erros { get; set; }
        public decimal? Nota { get; set; }
        public int? TempoGastoSegundos { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CriadoEm { get; set; }
    }

    public class AtividadeExecucaoCreateDto
    {
        public int UserId { get; set; }
        public int AtividadeId { get; set; }
        public int TotalQuestoes { get; set; }
    }

    public class AtividadeExecucaoFinalizarDto
    {
        public int Acertos { get; set; }
        public int Erros { get; set; }
        public decimal? Nota { get; set; }
        public int? TempoGastoSegundos { get; set; }
        public List<QuestaoResultadoDto>? QuestoesResultados { get; set; }
    }

    public class QuestaoResultadoDto
    {
        public int NumeroQuestao { get; set; }
        public string Resultado { get; set; } = string.Empty; // Acerto, Erro, Pulou
        public string? RespostaAluno { get; set; }
        public string? RespostaCorreta { get; set; }
        public int? TempoGastoSegundos { get; set; }
        public string? TopicoEspecifico { get; set; }
    }
}
