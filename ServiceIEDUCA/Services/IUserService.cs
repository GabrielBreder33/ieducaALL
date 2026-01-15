using System.Collections.Generic;
using ServiceIEDUCA.DTOs;

namespace ServiceIEDUCA.Services
{
    public interface IUserService
    {
        Task<UserDto> CreateUserAsync(UserCreateDto userCreateDto);
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<IEnumerable<UserDto>> GetAllUsersAsync();
        Task<bool> DeleteUserAsync(int id);
        Task<UserDto?> UpdateUserAsync(int id, UserCreateDto userCreateDto);
        Task<UserDto?> LoginAsync(UserLoginDto loginDto);
        Task<IEnumerable<UserDto>> GetAlunosByEscolaAsync(int escolaId);
        Task<IEnumerable<UserDto>> GetUsuariosByEscolaAsync(int escolaId);
        Task<bool> ResetPasswordAsync(int userId, string novaSenha);

    }
}
