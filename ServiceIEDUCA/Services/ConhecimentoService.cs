using Microsoft.EntityFrameworkCore;
using ServiceIEDUCA.Data;
using ServiceIEDUCA.DTOs;
using ServiceIEDUCA.Models;
using System.Collections.Generic;
using System.Linq;

namespace ServiceIEDUCA.Services
{
    public class ConhecimentoService : IConhecimentoService
    {
        private readonly AppDbContext _context;

        public ConhecimentoService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ConhecimentoDto>> GetAllConhecimento()
        {
            var conhecimentos = await _context.areas_conhecimento.ToListAsync();
            return conhecimentos.Select(MapToDto);
        }

        public async Task<ConhecimentoDto?> GetConhecimentoByIdAsync(int id)
        {
            var conhecimento = await _context.areas_conhecimento.FindAsync(id);
            return conhecimento != null ? MapToDto(conhecimento) : null;
        }

        public async Task<ConhecimentoDto> CreateConhecimentoAsync(ConhecimentoDto conhecimentoDto)
        {
            var conhecimento = new Conhecimento
            {
                Nome = conhecimentoDto.Nome
            };
            _context.areas_conhecimento.Add(conhecimento);
            await _context.SaveChangesAsync();
            return MapToDto(conhecimento);
        }

        public async Task<ConhecimentoDto?> UpdateConhecimentoAsync(int id, ConhecimentoDto conhecimentoDto)
        {
            var conhecimento = await _context.areas_conhecimento.FindAsync(id);
            if (conhecimento == null) return null;
            conhecimento.Nome = conhecimentoDto.Nome;
            _context.areas_conhecimento.Update(conhecimento);
            await _context.SaveChangesAsync();
            return MapToDto(conhecimento);
        }

        public async Task<bool> DeleteConhecimentoAsync(int id)
        {
            var conhecimento = await _context.areas_conhecimento.FindAsync(id);
            if (conhecimento == null) return false;
            _context.areas_conhecimento.Remove(conhecimento);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<MateriasDto>> GetMateriasByConhecimentoIdAsync(int conhecimentoId)
        {
            var materias = await _context.materias
                .Where(m => m.area_id == conhecimentoId)
                .ToListAsync();

            return materias.Select(MapToDto);
        }

        private ConhecimentoDto MapToDto(Conhecimento conhecimento)
        {
            return new ConhecimentoDto
            {
                Id = conhecimento.Id,
                Nome = conhecimento.Nome
            };
        }

        private MateriasDto MapToDto(Materias materias)
        {
            return new MateriasDto
            {
                Id = materias.Id,
                Nome = materias.Nome,
                area_id = materias.area_id
            };
        }
    }
}