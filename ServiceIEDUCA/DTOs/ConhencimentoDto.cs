using System.ComponentModel.DataAnnotations;

namespace ServiceIEDUCA.DTOs
{
    public class ConhecimentoDto
    {
        [Required(ErrorMessage = "Nome é obrigatório")]
        [MaxLength(100, ErrorMessage = "Nome não pode ter mais de 100 caracteres")]
        public string Nome { get; set; } = string.Empty;

        public int Id { get; set; }

    }
}
