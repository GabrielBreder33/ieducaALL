using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    [Table("ProfessorRedacaoGrifos")]
    public class ProfessorRedacaoGrifo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int RevisaoId { get; set; }

        [Required]
        public int PosicaoInicio { get; set; }

        [Required]
        public int PosicaoFim { get; set; }

        [Required]
        [MaxLength(30)]
        public string Cor { get; set; } = "yellow";

        [MaxLength(500)]
        public string? Comentario { get; set; }

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        [ForeignKey("RevisaoId")]
        public virtual ProfessorRedacaoRevisao? Revisao { get; set; }
    }
}
