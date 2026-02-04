using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    [Table("RedacaoCompetencias")]
    public class RedacaoCompetencias
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int RedacaoCorrecaoId { get; set; }

        [Required]
        public int NumeroCompetencia { get; set; }

        [Required]
        [MaxLength(200)]
        public string NomeCompetencia { get; set; } = string.Empty;

        [Required]
        public int Nota { get; set; }

        [MaxLength(1000)]
        public string? Comentario { get; set; }

        public string? Evidencias { get; set; }

        public string? Melhorias { get; set; }

        public DateTime CriadoEm { get; set; } = DateTime.Now;

        // Relacionamento
        [ForeignKey("RedacaoCorrecaoId")]
        public virtual RedacaoCorrecoes? RedacaoCorrecao { get; set; }
    }
}
