using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.Services;
using Serilog;
using Serilog.Context;

var builder = WebApplication.CreateBuilder(args);

#region SERILOG
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "ServiceIEDUCA")
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();
#endregion

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IConhecimentoService, ConhecimentoService>();
builder.Services.AddScoped<IRedacaoCorrecaoService, RedacaoCorrecaoService>();
builder.Services.AddScoped<IDeepSeekService, DeepSeekService>();

builder.Services.AddHttpClient<IRedacaoCorrecaoService, RedacaoCorrecaoService>();
builder.Services.AddHttpClient<IDeepSeekService, DeepSeekService>();

builder.Services.AddHostedService<RedacaoBackgroundService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "ServiceIEDUCA API", Version = "v1" });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

#region MIDDLEWARE REQUEST ID
app.Use(async (context, next) =>
{
    using (LogContext.PushProperty("RequestId", context.TraceIdentifier))
    {
        await next();
    }
});
#endregion 

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ServiceIEDUCA API v1"));
}

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run();
