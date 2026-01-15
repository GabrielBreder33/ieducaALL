using System.ComponentModel.DataAnnotations;

namespace ServiceIEDUCA.DTOs
{
    public class UserCreateDto
    {
        [Required(ErrorMessage = "Nome é obrigatório")]
        [MaxLength(100, ErrorMessage = "Nome não pode ter mais de 100 caracteres")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "Senha é obrigatória")]
        [MinLength(6, ErrorMessage = "Senha deve ter no mínimo 6 caracteres")]
        [MaxLength(255, ErrorMessage = "Senha não pode ter mais de 255 caracteres")]
        public string Senha { get; set; } = string.Empty;

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
