using Microsoft.AspNetCore.Mvc;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Services;

namespace ServiceIEDUCA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService userService, ILogger<UserController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
        {
            _logger.LogInformation("Buscando todos os usuários");

            try
            {
                var users = await _userService.GetAllUsersAsync();

                _logger.LogInformation(
                    "Usuários recuperados com sucesso | Total: {Count}",
                    users.Count()
                );

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar usuários");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetById(int id)
        {
            _logger.LogInformation("Buscando usuário | Id: {Id}", id);

            try
            {
                var user = await _userService.GetUserByIdAsync(id);
                if (user == null)
                {
                    _logger.LogWarning(
                        "Usuário não encontrado | Id: {Id}",
                        id
                    );
                    return NotFound($"Usuário com ID {id} não encontrado");
                }

                _logger.LogInformation(
                    "Usuário recuperado com sucesso | Id: {Id}, Nome: {Nome}",
                    user.Id,
                    user.Nome
                );

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar usuário {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> Create([FromBody] UserCreateDto userCreateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                _logger.LogInformation("Recebendo cadastro de usuário: {@UserCreateDto}", new
                {
                    userCreateDto.Nome,
                    userCreateDto.Email,
                    userCreateDto.Role,
                    userCreateDto.IdEscola
                });

                var createdUser = await _userService.CreateUserAsync(userCreateDto);

                _logger.LogInformation("Usuário criado com sucesso: {@User}", new
                {
                    createdUser.Id,
                    createdUser.Nome,
                    createdUser.IdEscola
                });

                return CreatedAtAction(nameof(GetById), new { id = createdUser.Id }, createdUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar usuário");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> Update(int id, [FromBody] UserCreateDto userCreateDto)
        {
            _logger.LogInformation(
                "Atualizando usuário | Id: {Id}, Nome: {Nome}, Email: {Email}",
                id,
                userCreateDto.Nome,
                userCreateDto.Email
            );

            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning(
                        "Atualização falhou por dados inválidos | Id: {Id}, Errors: {@Errors}",
                        id,
                        ModelState.Values.SelectMany(v => v.Errors)
                                         .Select(e => e.ErrorMessage)
                    );
                    return BadRequest(ModelState);
                }

                var updatedUser = await _userService.UpdateUserAsync(id, userCreateDto);
                if (updatedUser == null)
                {
                    _logger.LogWarning(
                        "Atualização falhou - usuário não encontrado | Id: {Id}",
                        id
                    );
                    return NotFound($"Usuário com ID {id} não encontrado");
                }

                _logger.LogInformation(
                    "Usuário atualizado com sucesso | Id: {Id}, Nome: {Nome}",
                    updatedUser.Id,
                    updatedUser.Nome
                );

                return Ok(updatedUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar usuário {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }


        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login([FromBody] UserLoginDto loginDto)
        {
            _logger.LogInformation(
                "Tentativa de login iniciada | Username: {Username}",
                loginDto.Email
            );

            try
            {
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning(
                        "Login falhou por dados inválidos | Errors: {@Errors}",
                        ModelState.Values.SelectMany(v => v.Errors)
                                         .Select(e => e.ErrorMessage)
                    );

                    return BadRequest(ModelState);
                }

                var user = await _userService.LoginAsync(loginDto);

                if (user == null)
                {
                    _logger.LogWarning(
                        "Login falhou por credenciais inválidas | Username: {Username}",
                        loginDto.Email
                    );

                    return Unauthorized("Nome ou senha inválidos");
                }

                _logger.LogInformation(
                    "Login bem-sucedido | Username: {Username}",
                    loginDto.Email
                );

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Erro ao realizar login | Username: {Username}",
                    loginDto.Email
                );
          
          
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("escola/{escolaId}/alunos")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAlunosByEscola(int escolaId)
        {
            _logger.LogInformation(
                "Buscando alunos da escola | EscolaId: {EscolaId}",
                escolaId
            );

            try
            {
                var alunos = await _userService.GetAlunosByEscolaAsync(escolaId);

                _logger.LogInformation(
                    "Alunos recuperados com sucesso | EscolaId: {EscolaId}, Total: {Count}",
                    escolaId,
                    alunos.Count()
                );

                return Ok(alunos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar alunos da escola {EscolaId}", escolaId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("escola/{escolaId}/usuarios")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsuariosByEscola(int escolaId)
        {
            _logger.LogInformation(
                "Buscando usuários da escola | EscolaId: {EscolaId}",
                escolaId
            );

            try
            {
                var usuarios = await _userService.GetUsuariosByEscolaAsync(escolaId);

                _logger.LogInformation(
                    "Usuários recuperados com sucesso | EscolaId: {EscolaId}, Total: {Count}",
                    escolaId,
                    usuarios.Count()
                );

                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar usuários da escola {EscolaId}", escolaId);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpPut("{id}/reset-password")]
        public async Task<ActionResult> ResetPassword(int id, [FromBody] ResetPasswordDto resetDto)
        {
            _logger.LogInformation(
                "Resetando senha do usuário | Id: {Id}",
                id
            );

            try
            {
                var success = await _userService.ResetPasswordAsync(id, resetDto.NovaSenha);
                if (!success)
                {
                    _logger.LogWarning(
                        "Reset de senha falhou - usuário não encontrado | Id: {Id}",
                        id
                    );
                    return NotFound($"Usuário com ID {id} não encontrado");
                }

                _logger.LogInformation(
                    "Senha resetada com sucesso | Id: {Id}",
                    id
                );

                return Ok(new { message = "Senha resetada com sucesso" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao resetar senha do usuário {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            _logger.LogInformation(
                "Deletando usuário | Id: {Id}",
                id
            );

            try
            {
                var deleted = await _userService.DeleteUserAsync(id);
                if (!deleted)
                {
                    _logger.LogWarning(
                        "Deleção falhou - usuário não encontrado | Id: {Id}",
                        id
                    );
                    return NotFound($"Usuário com ID {id} não encontrado");
                }

                _logger.LogInformation(
                    "Usuário deletado com sucesso | Id: {Id}",
                    id
                );

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao deletar usuário {Id}", id);
                return StatusCode(500, "Erro interno do servidor");
            }
        }
    }
}
