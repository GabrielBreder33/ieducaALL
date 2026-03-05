using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ServiceIEDUCA.Models
{
    [Table("RedacaoCustos")]
    public class RedacaoCustos
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int FkRedacao { get; set; }

        public int PromptCacheHitTokens { get; set; }

        [Column(TypeName = "decimal(18,8)")]
        public decimal PromptCacheHitPricing { get; set; }

        public int PromptCacheMissTokens { get; set; }

        [Column(TypeName = "decimal(18,8)")]
        public decimal PromptCacheMissPricing { get; set; }

        public int CustoOut { get; set; }

        [Column(TypeName = "decimal(18,8)")]
        public decimal CustoOutPricing { get; set; }

        [Column(TypeName = "decimal(18,8)")]
        public decimal Total { get; set; }

        [ForeignKey("FkRedacao")]
        public virtual RedacaoCorrecoes? Redacao { get; set; }
    }
}
