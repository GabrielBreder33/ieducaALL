using ServiceIEDUCA.Models;

namespace ServiceIEDUCA.Services
{
    public interface IMaterialService
    {
        Task<Material> ProcessarPdfAsync(Stream pdfStream, string nomeArquivo, int professorId, string nome, string? descricao, int? materiaId, CancellationToken cancellationToken = default);
        string ExtrairTextoPdf(Stream pdfStream);
        Task<string> ExtrairQuestoesComIAAsync(string textoExtraido, CancellationToken cancellationToken = default);
    }
}
