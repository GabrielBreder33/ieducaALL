using System.ComponentModel.DataAnnotations;

namespace ServiceIEDUCA.DTOs
{
    public class UserSelfUpdateDto
    {
        [Required(ErrorMessage = "Nome é obrigatório")]
        [StringLength(255)]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email é obrigatório")]
        [EmailAddress(ErrorMessage = "Email inválido")]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Telefone é obrigatório")]
        [StringLength(20)]
        public string Telefone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Senha atual é obrigatória para atualizar o perfil")]
        [MinLength(6, ErrorMessage = "Senha deve ter no mínimo 6 caracteres")]
        public string SenhaAtual { get; set; } = string.Empty;

        // Opcional: apenas se o usuário quiser alterar a senha
        [MinLength(6, ErrorMessage = "Nova senha deve ter no mínimo 6 caracteres")]
        public string? NovaSenha { get; set; }
    }
}
