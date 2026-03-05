using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    [Table("RedacaoFeedbacks")]
    public class RedacaoFeedbacks
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int RedacaoCorrecaoId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Tipo { get; set; } = string.Empty; // pontosPositivos, pontosMelhoria, recomendacoes

        [MaxLength(1000)]
        public string? Conteudo { get; set; }

        public int Ordem { get; set; }

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        // Relacionamento
        [ForeignKey("RedacaoCorrecaoId")]
        public virtual RedacaoCorrecoes? RedacaoCorrecao { get; set; }
    }
}
