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
            try
            {
                var users = await _userService.GetAllUsersAsync();
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
            try
            {
                var user = await _userService.GetUserByIdAsync(id);
                if (user == null)
                    return NotFound($"Usuário com ID {id} não encontrado");

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
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var updatedUser = await _userService.UpdateUserAsync(id, userCreateDto);
                if (updatedUser == null)
                    return NotFound($"Usuário com ID {id} não encontrado");

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
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var user = await _userService.LoginAsync(loginDto);
                if (user == null)
                    return Unauthorized("Nome ou senha inválidos");

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao realizar login");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        [HttpGet("escola/{escolaId}/alunos")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAlunosByEscola(int escolaId)
        {
            try
            {
                var alunos = await _userService.GetAlunosByEscolaAsync(escolaId);
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
            try
            {
                var usuarios = await _userService.GetUsuariosByEscolaAsync(escolaId);
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
            try
            {
                var success = await _userService.ResetPasswordAsync(id, resetDto.NovaSenha);
                if (!success)
                    return NotFound($"Usuário com ID {id} não encontrado");

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
            try
            {
                var deleted = await _userService.DeleteUserAsync(id);
                if (!deleted)
                    return NotFound($"Usuário com ID {id} não encontrado");

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
