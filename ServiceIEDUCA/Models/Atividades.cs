using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    public class Atividades
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Nome { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Descricao { get; set; }

        [Required]
        public int MateriaId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Tipo { get; set; } = string.Empty; // Quiz, Redação, Simulado

        [Required]
        [MaxLength(50)]
        public string NivelDificuldade { get; set; } = string.Empty; // Fácil, Médio, Difícil

        [Required]
        public int TotalQuestoes { get; set; }

        public bool Ativo { get; set; } = true;

        public DateTime CriadoEm { get; set; } = DateTime.Now;

        public DateTime? AtualizadoEm { get; set; }

        // Relacionamento
        [ForeignKey("MateriaId")]
        public virtual Materias? Materia { get; set; }

        public virtual ICollection<AtividadeExecucoes>? Execucoes { get; set; }
    }
}
