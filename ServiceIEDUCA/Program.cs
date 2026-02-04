using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// Configuração do DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Registro dos serviços
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IConhecimentoService, ConhecimentoService>();
builder.Services.AddScoped<IRedacaoCorrecaoService, RedacaoCorrecaoService>();
builder.Services.AddScoped<IDeepSeekService, DeepSeekService>();

// Adicionar HttpClient para chamadas à API
builder.Services.AddHttpClient<IRedacaoCorrecaoService, RedacaoCorrecaoService>();
builder.Services.AddHttpClient<IDeepSeekService, DeepSeekService>();

// Adicionar BackgroundService para processar correções
builder.Services.AddHostedService<RedacaoBackgroundService>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "ServiceIEDUCA API", Version = "v1" });
});

// Configuração de CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "ServiceIEDUCA API v1"));
}

// Desabilitar HTTPS redirect em desenvolvimento para permitir HTTP
// app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();
