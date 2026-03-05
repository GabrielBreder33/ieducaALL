using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Models;
using System.Collections.Generic;
using System.Linq;

namespace ServiceIEDUCA.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UserDto> CreateUserAsync(UserCreateDto userCreateDto)
        {
            var emailEmUso = await _context.Users
                .AnyAsync(u => u.Email.ToLower() == userCreateDto.Email.ToLower());

            if (emailEmUso)
                throw new InvalidOperationException($"O e-mail '{userCreateDto.Email}' já está em uso por outro usuário.");

            // Verifica se o telefone já está em uso (verificação por igualdade e por dígitos, para cobrir formatações)
            if (!string.IsNullOrWhiteSpace(userCreateDto.Telefone))
            {
                var telefoneExatoEmUso = await _context.Users
                    .AnyAsync(u => u.Telefone == userCreateDto.Telefone);

                if (telefoneExatoEmUso)
                    throw new InvalidOperationException($"O telefone '{userCreateDto.Telefone}' já está em uso por outro usuário.");

                // Normaliza para somente dígitos e compara com os telefones existentes em memória
                var novoTelefoneNormalized = new string(userCreateDto.Telefone.Where(char.IsDigit).ToArray());
                if (!string.IsNullOrEmpty(novoTelefoneNormalized))
                {
                    var telefonesExistentes = await _context.Users
                        .Where(u => u.Telefone != null)
                        .Select(u => u.Telefone)
                        .ToListAsync();

                    foreach (var t in telefonesExistentes)
                    {
                        var norm = new string(t.Where(char.IsDigit).ToArray());
                        if (norm == novoTelefoneNormalized)
                            throw new InvalidOperationException($"O telefone '{userCreateDto.Telefone}' já está em uso por outro usuário.");
                    }
                }
            }

            var hashedPassword = HashPassword(userCreateDto.Senha);

            var user = new User
            {
                Nome = userCreateDto.Nome,
                Email = userCreateDto.Email,
                Telefone = userCreateDto.Telefone,
                Role = userCreateDto.Role,
                Ativo = userCreateDto.Ativo,
                Senha = hashedPassword,
                DataCriacao = DateTime.UtcNow,
                id_Escola = userCreateDto.IdEscola
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return MapToDto(user);
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            return user != null ? MapToDto(user) : null;
        }



        public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
        {
            var users = await _context.Users.ToListAsync();
            return users.Select(MapToDto);
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UserDto?> UpdateUserAsync(int id, UserCreateDto userCreateDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return null;

            // Verificar se o email já está em uso por outro usuário
            if (user.Email != userCreateDto.Email)
            {
                var emailEmUso = await _context.Users
                    .AnyAsync(u => u.Id != id && u.Email.ToLower() == userCreateDto.Email.ToLower());

                if (emailEmUso)
                    throw new InvalidOperationException($"O e-mail '{userCreateDto.Email}' já está em uso por outro usuário.");
            }

            // Verificar se o telefone já está em uso por outro usuário
            if (!string.IsNullOrWhiteSpace(userCreateDto.Telefone) && user.Telefone != userCreateDto.Telefone)
            {
                var telefoneExatoEmUso = await _context.Users
                    .AnyAsync(u => u.Id != id && u.Telefone == userCreateDto.Telefone);

                if (telefoneExatoEmUso)
                    throw new InvalidOperationException($"O telefone '{userCreateDto.Telefone}' já está em uso por outro usuário.");

                var novoTelefoneNormalized = new string(userCreateDto.Telefone.Where(char.IsDigit).ToArray());
                if (!string.IsNullOrEmpty(novoTelefoneNormalized))
                {
                    var telefonesExistentes = await _context.Users
                        .Where(u => u.Id != id && u.Telefone != null)
                        .Select(u => u.Telefone)
                        .ToListAsync();

                    foreach (var t in telefonesExistentes)
                    {
                        var norm = new string(t.Where(char.IsDigit).ToArray());
                        if (norm == novoTelefoneNormalized)
                            throw new InvalidOperationException($"O telefone '{userCreateDto.Telefone}' já está em uso por outro usuário.");
                    }
                }
            }

            user.Nome = userCreateDto.Nome;
            user.Email = userCreateDto.Email;
            user.Telefone = userCreateDto.Telefone;
            
            // Só atualiza a senha se foi fornecida
            if (!string.IsNullOrWhiteSpace(userCreateDto.Senha))
            {
                user.Senha = HashPassword(userCreateDto.Senha);
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return MapToDto(user);
        }

        private UserDto MapToDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Nome = user.Nome,
                DataCriacao = user.DataCriacao,
                Email = user.Email,
                Telefone = user.Telefone ?? string.Empty,
                Role = user.Role,
                Ativo = user.Ativo,
                IdEscola = user.id_Escola
            };
        }



        public async Task<UserDto?> LoginAsync(UserLoginDto loginDto)
        {
            var hashedPassword = HashPassword(loginDto.Senha);
            
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email && u.Senha == hashedPassword);
            
            return user != null ? MapToDto(user) : null;
        }

        public async Task<IEnumerable<UserDto>> GetAlunosByEscolaAsync(int escolaId)
        {
            var alunos = await _context.Users
                .Where(u => u.id_Escola == escolaId && u.Role == "Aluno" && u.Ativo)
                .OrderBy(u => u.Nome)
                .ToListAsync();
            
            return alunos.Select(MapToDto);
        }

        public async Task<IEnumerable<UserDto>> GetUsuariosByEscolaAsync(int escolaId)
        {
            var usuarios = await _context.Users
                .Where(u => u.id_Escola == escolaId && u.Ativo)
                .OrderBy(u => u.Role)
                .ThenBy(u => u.Nome)
                .ToListAsync();
            
            return usuarios.Select(MapToDto);
        }

        public async Task<bool> ResetPasswordAsync(int userId, string novaSenha)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            user.Senha = HashPassword(novaSenha);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UserDto?> UpdateSelfProfileAsync(int id, UserSelfUpdateDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return null;

            // OBRIGATÓRIO: Verificar senha atual
            var hashedSenhaAtual = HashPassword(dto.SenhaAtual);
            if (user.Senha != hashedSenhaAtual)
            {
                throw new UnauthorizedAccessException("Senha atual incorreta");
            }

            // Verificar se o email já está em uso por outro usuário
            if (user.Email != dto.Email)
            {
                var emailEmUso = await _context.Users
                    .AnyAsync(u => u.Id != id && u.Email.ToLower() == dto.Email.ToLower());

                if (emailEmUso)
                    throw new InvalidOperationException($"O e-mail '{dto.Email}' já está em uso por outro usuário.");
            }

            // Verificar se o telefone já está em uso por outro usuário
            if (!string.IsNullOrWhiteSpace(dto.Telefone) && user.Telefone != dto.Telefone)
            {
                var telefoneExatoEmUso = await _context.Users
                    .AnyAsync(u => u.Id != id && u.Telefone == dto.Telefone);

                if (telefoneExatoEmUso)
                    throw new InvalidOperationException($"O telefone '{dto.Telefone}' já está em uso por outro usuário.");

                var novoTelefoneNormalized = new string(dto.Telefone.Where(char.IsDigit).ToArray());
                if (!string.IsNullOrEmpty(novoTelefoneNormalized))
                {
                    var telefonesExistentes = await _context.Users
                        .Where(u => u.Id != id && u.Telefone != null)
                        .Select(u => u.Telefone)
                        .ToListAsync();

                    foreach (var t in telefonesExistentes)
                    {
                        var norm = new string(t.Where(char.IsDigit).ToArray());
                        if (norm == novoTelefoneNormalized)
                            throw new InvalidOperationException($"O telefone '{dto.Telefone}' já está em uso por outro usuário.");
                    }
                }
            }

            // Atualizar dados básicos
            user.Nome = dto.Nome;
            user.Email = dto.Email;
            user.Telefone = dto.Telefone;
            
            // Atualizar senha se fornecida
            if (!string.IsNullOrWhiteSpace(dto.NovaSenha))
            {
                user.Senha = HashPassword(dto.NovaSenha);
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return MapToDto(user);
        }

        private string HashPassword(string password)
        {
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            var bytes = System.Text.Encoding.UTF8.GetBytes(password);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}
