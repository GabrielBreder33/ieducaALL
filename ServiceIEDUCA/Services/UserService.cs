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
            var hashedPassword = HashPassword(userCreateDto.Senha);

            var user = new User
            {
                Nome = userCreateDto.Nome,
                Email = userCreateDto.Email,
                Telefone = userCreateDto.Telefone,
                Role = userCreateDto.Role,
                Ativo = userCreateDto.Ativo,
                Senha = hashedPassword,
                DataCriacao = DateTime.Now,
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

            user.Nome = userCreateDto.Nome;
            user.Senha = HashPassword(userCreateDto.Senha);

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

        private string HashPassword(string password)
        {
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            var bytes = System.Text.Encoding.UTF8.GetBytes(password);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}
