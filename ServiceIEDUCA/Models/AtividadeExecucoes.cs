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
        public DateTime DataInicio { get; set; } = DateTime.Now;

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

        public DateTime CriadoEm { get; set; } = DateTime.Now;

        [MaxLength(20)]
        public string Status { get; set; } = "Em Andamento"; // Em Andamento, Concluída, Abandonada

        // Relacionamentos
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [ForeignKey("AtividadeId")]
        public virtual Atividades? Atividade { get; set; }

        public virtual ICollection<AtividadeQuestaoResultados>? QuestaoResultados { get; set; }
    }
}
