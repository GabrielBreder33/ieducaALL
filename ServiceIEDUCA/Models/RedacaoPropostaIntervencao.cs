using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    [Table("RedacaoPropostaIntervencao")]
    public class RedacaoPropostaIntervencao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int RedacaoCorrecaoId { get; set; }

        [MaxLength(2000)]
        public string? Avaliacao { get; set; }

        public string? SugestoesConcretas { get; set; }

        public DateTime CriadoEm { get; set; } = DateTime.Now;

        // Relacionamento
        [ForeignKey("RedacaoCorrecaoId")]
        public virtual RedacaoCorrecoes? RedacaoCorrecao { get; set; }
    }
}
