using System.ComponentModel.DataAnnotations;

namespace ServiceIEDUCA.DTOs
{
    public class UserCreateDto
    {
        [Required(ErrorMessage = "Nome é obrigatório")]
        [MaxLength(100, ErrorMessage = "Nome não pode ter mais de 100 caracteres")]
        public string Nome { get; set; } = string.Empty;

        // Senha sem validações de atributos - validação manual no controller
        public string? Senha { get; set; }

        [Required(ErrorMessage = "Email é obrigatório")]
        [EmailAddress(ErrorMessage = "Email inválido")]
        public string Email { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Telefone inválido")]
        public string? Telefone { get; set; }

        public string Role { get; set; } = string.Empty;
        public bool Ativo { get; set; } = true;
        public int IdEscola { get; set; }
    }
}
