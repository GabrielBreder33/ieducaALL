namespace ServiceIEDUCA.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public DateTime DataCriacao { get; set; }
        public string Email { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public string Role { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;
        public int IdEscola { get; set; }
    }
}
