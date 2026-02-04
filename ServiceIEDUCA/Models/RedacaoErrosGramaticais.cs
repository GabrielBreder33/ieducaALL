using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    [Table("RedacaoErrosGramaticais")]
    public class RedacaoErrosGramaticais
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int RedacaoCorrecaoId { get; set; }

        [Required]
        public int PosicaoInicio { get; set; }

        [Required]
        public int PosicaoFim { get; set; }

        [MaxLength(500)]
        public string? TextoOriginal { get; set; }

        [MaxLength(500)]
        public string? TextoSugerido { get; set; }

        [MaxLength(1000)]
        public string? Explicacao { get; set; }

        [MaxLength(20)]
        public string? Severidade { get; set; }

        public DateTime CriadoEm { get; set; } = DateTime.Now;

        // Relacionamento
        [ForeignKey("RedacaoCorrecaoId")]
        public virtual RedacaoCorrecoes? RedacaoCorrecao { get; set; }
    }
}
