using System;
using System.Collections.Generic;

namespace ServiceIEDUCA.TempModels;

public partial class RedacaoCorreco
{
    public int Id { get; set; }

    public int? AtividadeExecucaoId { get; set; }

    public string Tema { get; set; } = null!;

    public string TextoRedacao { get; set; } = null!;

    public bool NotaZero { get; set; }

    public string? MotivoNotaZero { get; set; }

    public int NotaTotal { get; set; }

    public string ResumoFinal { get; set; } = null!;

    public string? VersaoReescrita { get; set; }

    public decimal? ConfiancaAvaliacao { get; set; }

    public DateTime CriadoEm { get; set; }

    public DateTime? AtualizadoEm { get; set; }

    public int? UserId { get; set; }

    public string Status { get; set; } = null!;

    public int Progresso { get; set; }

    public string TipoAvaliacao { get; set; } = null!;
}
