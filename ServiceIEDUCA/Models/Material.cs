using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    public class Material
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProfessorId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Nome { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Descricao { get; set; }

        public int? MateriaId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Tipo { get; set; } = string.Empty; // PDF, Conteudo

        // Texto extraído do PDF
        public string? ConteudoTexto { get; set; }

        // Questões extraídas pela IA (JSON)
        public string? QuestoesJson { get; set; }

        public int TotalQuestoes { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Processando"; // Processando, Concluido, Erro

        public string? ErroProcessamento { get; set; }

        public bool Ativo { get; set; } = true;

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        public DateTime? AtualizadoEm { get; set; }

        [ForeignKey("ProfessorId")]
        public virtual User? Professor { get; set; }

        [ForeignKey("MateriaId")]
        public virtual Materias? Materia { get; set; }
    }
}
