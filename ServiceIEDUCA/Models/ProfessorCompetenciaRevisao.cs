using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    [Table("ProfessorCompetenciaRevisoes")]
    public class ProfessorCompetenciaRevisao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int RevisaoId { get; set; }

        [Required]
        public int NumeroCompetencia { get; set; }

        [Required]
        public int NotaProfessor { get; set; }

        [MaxLength(2000)]
        public string? ComentarioProfessor { get; set; }

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        // Relacionamento
        [ForeignKey("RevisaoId")]
        public virtual ProfessorRedacaoRevisao? Revisao { get; set; }
    }
}
