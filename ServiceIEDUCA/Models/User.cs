using System.ComponentModel.DataAnnotations;

namespace ServiceIEDUCA.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Senha { get; set; } = string.Empty;

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(15)]
        public string? Telefone { get; set; }
        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = string.Empty;
        public int id_Escola { get; set; }

        public bool Ativo { get; set; } = true;
    }
}
