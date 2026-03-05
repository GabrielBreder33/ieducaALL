using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    public class AtividadeExecucoes
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int AtividadeId { get; set; }

        [Required]
        public DateTime DataInicio { get; set; } = DateTime.UtcNow;

        public DateTime? DataFim { get; set; }

        [Required]
        public int TotalQuestoes { get; set; }

        [Required]
        public int Acertos { get; set; }

        [Required]
        public int Erros { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Nota { get; set; }

        /// <summary>
        /// Tempo gasto em segundos
        /// </summary>
        public int? TempoGastoSegundos { get; set; }

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        [MaxLength(20)]
        public string Status { get; set; } = "Em Andamento"; // Em Andamento, Concluída, Abandonada

    // Campos para Atividades Geradas por IA
    [MaxLength(100)]
    public string? Materia { get; set; }

    [MaxLength(50)]
    public string? Segmento { get; set; }

    [MaxLength(50)]
    public string? Ano { get; set; }

    [MaxLength(500)]
    public string? Conteudo { get; set; }

    [MaxLength(50)]
    public string? Nivel { get; set; }

    [MaxLength(50)]
    public string? Tipo { get; set; }

    public bool GeradaPorIA { get; set; } = false;

    // Campos JSON para armazenar questões, gabaritos e respostas (para atividades IA)
    public string? QuestoesJson { get; set; }
    public string? GabaritoJson { get; set; }
    public string? RespostasJson { get; set; }

    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;


        [ForeignKey("AtividadeId")]
        public virtual Atividades? Atividade { get; set; }

        public virtual ICollection<AtividadeQuestaoResultados>? QuestaoResultados { get; set; }
    }
}
