using Microsoft.AspNetCore.Http;

namespace ServiceIEDUCA.DTOs
{
    public class MaterialDto
    {
        public int Id { get; set; }
        public int ProfessorId { get; set; }
        public string ProfessorNome { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int? MateriaId { get; set; }
        public string? MateriaNome { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string? QuestoesJson { get; set; }
        public int TotalQuestoes { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ErroProcessamento { get; set; }
        public bool Ativo { get; set; }
        public DateTime CriadoEm { get; set; }
    }

    public class MaterialUploadDto
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int? MateriaId { get; set; }
        public int ProfessorId { get; set; }
        public IFormFile Arquivo { get; set; } = null!;
    }

    public class MaterialUpdateDto
    {
        public string? Nome { get; set; }
        public string? Descricao { get; set; }
        public int? MateriaId { get; set; }
        public bool? Ativo { get; set; }
    }
}
