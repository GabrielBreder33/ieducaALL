using System.ComponentModel.DataAnnotations;

namespace ServiceIEDUCA.DTOs
{
    public class MateriasDto
    {
        [Required(ErrorMessage = "Nome é obrigatório")]
        [MaxLength(100, ErrorMessage = "Nome não pode ter mais de 100 caracteres")]
        public string Nome { get; set; } = string.Empty;

        public int Id { get; set; }

        public int area_id { get; set; }

    }
}
