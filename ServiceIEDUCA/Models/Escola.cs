using System.ComponentModel.DataAnnotations;

namespace ServiceIEDUCA.Models
{
    public class Escola
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nome { get; set; } = string.Empty;
        [Required]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string senha { get; set; } = string.Empty;
        [Required]
        public DateTime data_criacao { get; set; } = DateTime.UtcNow;
    }
}
