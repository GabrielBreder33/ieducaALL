using System.ComponentModel.DataAnnotations;

namespace ServiceIEDUCA.DTOs
{
    public class ResetPasswordDto
    {
        [Required(ErrorMessage = "Nova senha é obrigatória")]
        [MinLength(6, ErrorMessage = "Senha deve ter no mínimo 6 caracteres")]
        public string NovaSenha { get; set; } = string.Empty;
    }
}
