using System.ComponentModel.DataAnnotations;

namespace ServiceIEDUCA.Models
{
    public class Materias
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nome { get; set; } = string.Empty;
        public int area_id { get; set; }

    }
}
