using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    [Table("Notificacoes")]
    public class Notificacao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(300)]
        public string Mensagem { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Tipo { get; set; } = "info"; // info, atividade, redacao

        public int? ReferenciaId { get; set; } // ID da atividade, redacao, etc.

        [MaxLength(50)]
        public string? ReferenciaTipo { get; set; } // "AtividadeAtribuicao", "Redacao", etc.

        public bool Lida { get; set; } = false;

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
