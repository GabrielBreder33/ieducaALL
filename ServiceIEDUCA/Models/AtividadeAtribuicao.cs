using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    [Table("AtividadeAtribuicoes")]
    public class AtividadeAtribuicao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int AtividadeId { get; set; }

        [Required]
        public int ProfessorId { get; set; }

        public int? AlunoId { get; set; }

        [Required]
        public int EscolaId { get; set; }

        public DateTime? Prazo { get; set; }

        [MaxLength(2000)]
        public string? Instrucoes { get; set; }

        [MaxLength(30)]
        public string Status { get; set; } = "Ativa"; // Ativa, Encerrada, Cancelada

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        public DateTime? AtualizadoEm { get; set; }

        [ForeignKey("AtividadeId")]
        public virtual Atividades? Atividade { get; set; }

        [ForeignKey("ProfessorId")]
        public virtual User? Professor { get; set; }

        [ForeignKey("AlunoId")]
        public virtual User? Aluno { get; set; }

        [ForeignKey("EscolaId")]
        public virtual Escola? Escola { get; set; }
    }
}
