using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Models;
using BCrypt.Net;

namespace ServiceIEDUCA.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EscolaController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EscolaController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Escola
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EscolaDto>>> GetEscolas()
        {
            var escolas = await _context.escola
                .Select(e => new EscolaDto
                {
                    Id = e.Id,
                    Nome = e.Nome,
                    Email = e.Email,
                    DataCriacao = e.data_criacao
                })
                .ToListAsync();

            return Ok(escolas);
        }

        // GET: api/Escola/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EscolaDto>> GetEscola(int id)
        {
            var escola = await _context.escola.FindAsync(id);

            if (escola == null)
            {
                return NotFound(new { message = "Escola não encontrada" });
            }

            var escolaDto = new EscolaDto
            {
                Id = escola.Id,
                Nome = escola.Nome,
                Email = escola.Email,
                DataCriacao = escola.data_criacao
            };

            return Ok(escolaDto);
        }

        // POST: api/Escola
        [HttpPost]
        public async Task<ActionResult<EscolaDto>> CreateEscola([FromBody] EscolaCreateDto escolaDto)
        {
            // Validar dados
            if (string.IsNullOrWhiteSpace(escolaDto.Nome))
            {
                return BadRequest(new { message = "Nome da escola é obrigatório" });
            }

            if (string.IsNullOrWhiteSpace(escolaDto.Email))
            {
                return BadRequest(new { message = "Email é obrigatório" });
            }

            if (string.IsNullOrWhiteSpace(escolaDto.Senha))
            {
                return BadRequest(new { message = "Senha é obrigatória" });
            }

            // Verificar se o email já existe
            var emailExiste = await _context.escola
                .AnyAsync(e => e.Email.ToLower() == escolaDto.Email.ToLower());

            if (emailExiste)
            {
                return BadRequest(new { message = "Email já cadastrado" });
            }

            // Criar nova escola
            var escola = new Escola
            {
                Nome = escolaDto.Nome,
                Email = escolaDto.Email,
                senha = BCrypt.Net.BCrypt.HashPassword(escolaDto.Senha),
                data_criacao = DateTime.Now
            };

            _context.escola.Add(escola);
            await _context.SaveChangesAsync();

            var escolaDtoResponse = new EscolaDto
            {
                Id = escola.Id,
                Nome = escola.Nome,
                Email = escola.Email,
                DataCriacao = escola.data_criacao
            };

            return CreatedAtAction(nameof(GetEscola), new { id = escola.Id }, escolaDtoResponse);
        }

        // PUT: api/Escola/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEscola(int id, [FromBody] EscolaUpdateDto escolaDto)
        {
            var escola = await _context.escola.FindAsync(id);

            if (escola == null)
            {
                return NotFound(new { message = "Escola não encontrada" });
            }

            // Atualizar campos se fornecidos
            if (!string.IsNullOrWhiteSpace(escolaDto.Nome))
            {
                escola.Nome = escolaDto.Nome;
            }

            if (!string.IsNullOrWhiteSpace(escolaDto.Email))
            {
                // Verificar se o novo email já existe (exceto para esta escola)
                var emailExiste = await _context.escola
                    .AnyAsync(e => e.Email.ToLower() == escolaDto.Email.ToLower() && e.Id != id);

                if (emailExiste)
                {
                    return BadRequest(new { message = "Email já cadastrado" });
                }

                escola.Email = escolaDto.Email;
            }

            if (!string.IsNullOrWhiteSpace(escolaDto.Senha))
            {
                escola.senha = BCrypt.Net.BCrypt.HashPassword(escolaDto.Senha);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await EscolaExists(id))
                {
                    return NotFound(new { message = "Escola não encontrada" });
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Escola/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEscola(int id)
        {
            var escola = await _context.escola.FindAsync(id);

            if (escola == null)
            {
                return NotFound(new { message = "Escola não encontrada" });
            }

            _context.escola.Remove(escola);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Escola/login
        [HttpPost("login")]
        public async Task<ActionResult<EscolaDto>> Login([FromBody] EscolaLoginDto loginDto)
        {
            if (string.IsNullOrWhiteSpace(loginDto.Email) || string.IsNullOrWhiteSpace(loginDto.Senha))
            {
                return BadRequest(new { message = "Email e senha são obrigatórios" });
            }

            var escola = await _context.escola
                .FirstOrDefaultAsync(e => e.Email.ToLower() == loginDto.Email.ToLower());

            if (escola == null)
            {
                return Unauthorized(new { message = "Email ou senha incorretos" });
            }

            // Verificar senha
            if (!BCrypt.Net.BCrypt.Verify(loginDto.Senha, escola.senha))
            {
                return Unauthorized(new { message = "Email ou senha incorretos" });
            }

            var escolaDto = new EscolaDto
            {
                Id = escola.Id,
                Nome = escola.Nome,
                Email = escola.Email,
                DataCriacao = escola.data_criacao
            };

            return Ok(escolaDto);
        }

        private async Task<bool> EscolaExists(int id)
        {
            return await _context.escola.AnyAsync(e => e.Id == id);
        }
    }
}
