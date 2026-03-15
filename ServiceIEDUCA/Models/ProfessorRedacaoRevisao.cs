using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    [Table("ProfessorRedacaoRevisoes")]
    public class ProfessorRedacaoRevisao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int RedacaoCorrecaoId { get; set; }

        [Required]
        public int ProfessorId { get; set; }

        [Column(TypeName = "decimal(7,2)")]
        public decimal NotaTotalProfessor { get; set; }

        [MaxLength(3000)]
        public string? ComentarioGeral { get; set; }

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        public DateTime? AtualizadoEm { get; set; }

        [ForeignKey("RedacaoCorrecaoId")]
        public virtual RedacaoCorrecoes? RedacaoCorrecao { get; set; }

        [ForeignKey("ProfessorId")]
        public virtual User? Professor { get; set; }

        public virtual ICollection<ProfessorCompetenciaRevisao>? CompetenciaRevisoes { get; set; }

        public virtual ICollection<ProfessorRedacaoGrifo>? Grifos { get; set; }
    }
}
