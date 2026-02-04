namespace ServiceIEDUCA.Services
{
    public interface IDeepSeekService
    {
        Task<string> GerarAtividadeAsync(string prompt);
    }
}
