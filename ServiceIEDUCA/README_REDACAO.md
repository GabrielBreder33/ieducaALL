# Sistema de Correção de Redações - iEduca

## 📋 Visão Geral

Sistema completo de correção automática de redações usando DeepSeek AI, seguindo os critérios do ENEM com 5 competências.

## 🏗️ Arquitetura

### Componentes Principais

1. **RedacaoCorrecaoController** - Endpoints da API
2. **RedacaoCorrecaoService** - Lógica de negócio e integração com DeepSeek
3. **RedacaoBackgroundService** - Processamento em background e retry de correções travadas
4. **Models** - Entidades do banco de dados

### Tabelas do Banco de Dados

- **RedacaoCorrecoes** - Tabela principal com dados da redação e status
- **RedacaoCompetencias** - 5 competências do ENEM (0-200 pontos cada)
- **RedacaoErrosGramaticais** - Erros encontrados com sugestões de correção
- **RedacaoFeedbacks** - Pontos positivos, melhorias e recomendações
- **RedacaoPropostaIntervencao** - Análise da proposta de intervenção

## 🔄 Fluxo de Correção

### 1. Envio da Redação
```http
POST /api/RedacaoCorrecao/corrigir
Content-Type: application/json

{
  "userId": 1,
  "atividadeExecucaoId": 123,
  "tema": "Desafios para a valorização de comunidades e povos tradicionais no Brasil",
  "textoRedacao": "A sociedade brasileira...",
  "tipoAvaliacao": "ENEM"
}
```

**Resposta:**
```json
{
  "id": 45,
  "message": "Redação enviada para correção! O processamento está em andamento.",
  "status": "Processando",
  "progresso": 0
}
```

### 2. Processamento em Background

O serviço processa automaticamente:

1. **Progresso 10%** - Analisando texto
2. **Chamada à API DeepSeek** - Correção completa
3. **Progresso 50%** - Processando análise
4. **Salvar resultados** - Persistência no banco
5. **Progresso 100%** - Concluída

### 3. Consultar Progresso
```http
GET /api/RedacaoCorrecao/{id}/progresso
```

**Resposta:**
```json
{
  "id": 45,
  "status": "Processando",
  "progresso": 50,
  "concluida": false
}
```

### 4. Obter Resultado Completo
```http
GET /api/RedacaoCorrecao/{id}
```

**Resposta:**
```json
{
  "id": 45,
  "tema": "Desafios para a valorização...",
  "textoRedacao": "A sociedade brasileira...",
  "notaZero": false,
  "motivoNotaZero": null,
  "notaTotal": 880,
  "resumoFinal": "A redação demonstra...",
  "competencias": [
    {
      "numeroCompetencia": 1,
      "nomeCompetencia": "Domínio da norma culta",
      "nota": 180,
      "comentario": "Excelente domínio...",
      "evidencias": ["Uso correto de vírgulas...", "Concordância verbal..."],
      "melhorias": ["Evitar repetições..."]
    }
  ],
  "errosGramaticais": [
    {
      "posicaoInicio": 45,
      "posicaoFim": 60,
      "textoOriginal": "a onde",
      "textoSugerido": "aonde",
      "explicacao": "A palavra 'aonde' deve ser escrita junta...",
      "severidade": "alta"
    }
  ],
  "feedbacks": {
    "pontosPositivos": ["Argumentação bem estruturada", "Boa coesão textual"],
    "pontosMelhoria": ["Desenvolver melhor o terceiro parágrafo"],
    "recomendacoes": ["Estudar conectivos de contraste"]
  },
  "propostaIntervencao": {
    "avaliacao": "A proposta apresentada é completa...",
    "sugestoesConcretas": ["Especificar o agente executor", "Detalhar o financiamento"]
  },
  "versaoReescrita": "A sociedade brasileira contemporânea...",
  "confiancaAvaliacao": 92.5,
  "status": "Concluída",
  "progresso": 100
}
```

### 5. Listar Redações do Usuário
```http
GET /api/RedacaoCorrecao/usuario/{userId}
```

## ⚙️ Configuração

### 1. Configurar API DeepSeek

Edite `appsettings.json`:

```json
{
  "DeepSeek": {
    "ApiKey": "sua-api-key-aqui",
    "ApiUrl": "https://api.deepseek.com/v1/chat/completions"
  }
}
```

### 2. Criar Tabelas no Banco de Dados

Execute o script SQL:
```bash
sqlcmd -S localhost,1433 -U sa -P SuaSenha -i CriarTabelasRedacao.sql
```

Ou execute diretamente no SQL Server Management Studio o arquivo `CriarTabelasRedacao.sql`

### 3. Executar Migrations (Alternativa)

```bash
dotnet ef migrations add AddRedacaoTables
dotnet ef database update
```

## 🚀 Como Usar

### 1. Iniciar o Serviço

```bash
cd ServiceIEDUCA
dotnet run
```

### 2. Testar Endpoints

Use Swagger UI: `http://localhost:5000/swagger`

Ou use curl:

```bash
# Enviar redação
curl -X POST "http://localhost:5000/api/RedacaoCorrecao/corrigir" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "tema": "Tema da redação",
    "textoRedacao": "Texto completo da redação..."
  }'

# Consultar progresso
curl "http://localhost:5000/api/RedacaoCorrecao/45/progresso"

# Obter resultado
curl "http://localhost:5000/api/RedacaoCorrecao/45"
```

## 📊 Critérios de Correção ENEM

### Competências (0-200 pontos cada):

1. **Competência 1** - Domínio da modalidade escrita formal da língua portuguesa
2. **Competência 2** - Compreender o tema e aplicar conceitos
3. **Competência 3** - Selecionar, relacionar e organizar argumentos
4. **Competência 4** - Mecanismos linguísticos para argumentação
5. **Competência 5** - Proposta de intervenção respeitando direitos humanos

**Nota Total**: Soma das 5 competências (0-1000 pontos)

### Casos de Nota Zero:

- Fuga total ao tema
- Não atendimento ao tipo textual dissertativo-argumentativo
- Texto com até 7 linhas
- Cópia de texto motivador
- Impropérios, desenhos ou sinais gráficos
- Parte do texto ilegível
- Desrespeito aos direitos humanos

## 🔧 Manutenção

### Background Service

O `RedacaoBackgroundService` executa a cada 30 segundos e:

- Identifica correções travadas (mais de 5 minutos em processamento)
- Tenta reprocessar automaticamente
- Registra erros no log

### Logs

Verifique os logs para debugging:

```bash
# Logs da aplicação
tail -f logs/app.log

# Ou use o console durante desenvolvimento
dotnet run
```

## 🐛 Troubleshooting

### Correção não processa

1. Verifique a API Key do DeepSeek
2. Confirme conexão com internet
3. Verifique logs de erro
4. Tente reenviar a redação

### Erro de conexão com banco

1. Verifique connection string
2. Confirme que o SQL Server está rodando
3. Execute o script de criação de tabelas

### Progresso travado

O BackgroundService irá automaticamente reprocessar após 5 minutos.

## 📈 Melhorias Futuras

- [ ] Streaming de progresso via WebSockets
- [ ] Cache de correções similares
- [ ] Análise de plágio
- [ ] Comparação com redações nota 1000
- [ ] Dashboard de estatísticas
- [ ] Exportação em PDF
- [ ] Múltiplos modelos de IA (GPT-4, Claude, etc.)

## 📝 Notas Técnicas

- **Processamento Assíncrono**: Usa `Task.Run` para não bloquear a thread da requisição
- **Retry Automático**: BackgroundService identifica e reprocessa correções travadas
- **Transações**: Utiliza EF Core com transações implícitas
- **Performance**: Índices otimizados para consultas frequentes
- **Escalabilidade**: Pronto para múltiplas instâncias (necessário fila distribuída no futuro)

## 🔒 Segurança

- Validação de entrada no controller
- Escape de HTML em textos salvos
- API Key armazenada em configuração (usar Azure Key Vault em produção)
- Logs não expõem dados sensíveis

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação ou abra uma issue no repositório.

---

**Desenvolvido para iEduca** - Sistema de Educação Inteligente
