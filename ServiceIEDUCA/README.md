# ServiceIEDUCA - Sistema de Cadastro de Usuários

API RESTful desenvolvida em ASP.NET Core 8.0 com arquitetura em camadas (MVC + Service Layer).

## 📁 Estrutura do Projeto

```
ServiceIEDUCA/
├── Controllers/          # Controladores da API
│   └── UserController.cs
├── Services/            # Camada de serviços
│   ├── IUserService.cs
│   └── UserService.cs
├── Models/              # Entidades do banco de dados
│   └── User.cs
├── DTOs/                # Data Transfer Objects
│   ├── UserCreateDto.cs
│   └── UserDto.cs
├── Data/                # Contexto do Entity Framework
│   └── AppDbContext.cs
└── Program.cs           # Configuração da aplicação
```

## 🚀 Tecnologias Utilizadas

- .NET 8.0
- ASP.NET Core Web API
- Entity Framework Core 8.0
- SQL Server
- Swagger/OpenAPI

## 📋 Pré-requisitos

- .NET 8.0 SDK
- SQL Server (LocalDB ou Express)
- Visual Studio 2022 ou VS Code

## ⚙️ Configuração

1. **Restaurar pacotes NuGet:**
```bash
dotnet restore
```

2. **Configurar a conexão com o banco de dados:**
Edite o arquivo `appsettings.json` e ajuste a connection string conforme seu ambiente.

3. **Criar o banco de dados:**
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## ▶️ Executar o Projeto

```bash
dotnet run
```

A API estará disponível em:
- HTTP: http://localhost:5000
- HTTPS: https://localhost:5001
- Swagger UI: https://localhost:5001/swagger

## 📌 Endpoints da API

### Usuários

- `GET /api/user` - Listar todos os usuários
- `GET /api/user/{id}` - Buscar usuário por ID
- `POST /api/user` - Criar novo usuário
- `PUT /api/user/{id}` - Atualizar usuário
- `DELETE /api/user/{id}` - Deletar usuário

### Exemplo de Requisição (POST)

```json
{
  "nome": "João Silva",
  "senha": "senha123"
}
```

### Exemplo de Resposta

```json
{
  "id": 1,
  "nome": "João Silva",
  "dataCriacao": "2026-01-01T10:30:00"
}
```

## 🔒 Segurança

⚠️ **Nota:** Este projeto usa hash SHA256 básico para senhas. Para produção, utilize bibliotecas como:
- BCrypt.Net-Next
- ASP.NET Core Identity

## 📝 Próximos Passos

- [ ] Implementar autenticação JWT
- [ ] Adicionar validações mais robustas
- [ ] Implementar tratamento de erros global
- [ ] Adicionar testes unitários
- [ ] Implementar paginação nos endpoints de listagem
