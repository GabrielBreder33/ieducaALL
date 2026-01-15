# Guia de Integração - Sistema de Estudos e Redação

## 📋 Funcionalidades Implementadas

### 1️⃣ Sistema de Estudo com Timer
- ✅ Configuração de tempo de estudo (30, 45, 60 min ou customizado)
- ✅ Campo para tema de estudo
- ✅ Timer regressivo com contador visual
- ✅ Avisos automáticos aos 10, 5 e 1 minuto restantes
- ✅ Som ao finalizar o tempo
- ✅ Opções de pausar e cancelar estudo

### 2️⃣ Sistema de Redação
- ✅ Modal obrigatório ao final do tempo de estudo
- ✅ Exibição do tema estudado
- ✅ Editor de texto com:
  - Contador de palavras
  - Contador de linhas
  - Validação de linha mínima (20 linhas)
  - Aviso visual quando não atingir o mínimo
- ✅ Botão de envio para correção (desabilitado se não atingir mínimo)

### 3️⃣ Sistema de Correção por IA
- ✅ Serviço de IA mock implementado
- ✅ Feedback estruturado com:
  - Pontos positivos
  - Pontos a melhorar
  - Nota estimada
  - Recomendações personalizadas
  - Análise detalhada
- ✅ Interface de exibição de correção
- ✅ Botão para concluir e reiniciar ciclo

## 🔧 Como Integrar com API de IA Real

### Opção 1: OpenAI (GPT-4)

1. **Obter API Key:**
   - Acesse [platform.openai.com](https://platform.openai.com)
   - Crie uma conta e gere uma API key

2. **Configurar Variável de Ambiente:**
   ```bash
   # Crie um arquivo .env na raiz do projeto
   VITE_OPENAI_API_KEY=sua-chave-aqui
   ```

3. **Atualizar `aiService.ts`:**
   ```typescript
   async correctEssay(
     theme: string,
     content: string,
     type: string = 'ENEM'
   ): Promise<EssayCorrection> {
     const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
     
     const response = await fetch('https://api.openai.com/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${apiKey}`
       },
       body: JSON.stringify({
         model: 'gpt-4',
         messages: [
           {
             role: 'system',
             content: `Você é um professor especialista em correção de redações do ${type}. 
             Forneça uma correção detalhada seguindo os critérios do ${type}.
             Retorne sua análise em formato JSON com os campos:
             - positivePoints (array de strings)
             - improvementPoints (array de strings)
             - estimatedGrade (número de 0 a 1000)
             - recommendations (array de strings)
             - feedback (texto detalhado)`
           },
           {
             role: 'user',
             content: `Tema: ${theme}\n\nRedação:\n${content}`
           }
         ],
         temperature: 0.7,
         max_tokens: 2000
       })
     });
     
     const data = await response.json();
     return JSON.parse(data.choices[0].message.content);
   }
   ```

### Opção 2: Anthropic (Claude)

1. **Obter API Key:**
   - Acesse [console.anthropic.com](https://console.anthropic.com)

2. **Configurar Variável de Ambiente:**
   ```bash
   VITE_ANTHROPIC_API_KEY=sua-chave-aqui
   ```

3. **Atualizar `aiService.ts`:**
   ```typescript
   async correctEssay(
     theme: string,
     content: string,
     type: string = 'ENEM'
   ): Promise<EssayCorrection> {
     const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
     
     const response = await fetch('https://api.anthropic.com/v1/messages', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'x-api-key': apiKey,
         'anthropic-version': '2023-06-01'
       },
       body: JSON.stringify({
         model: 'claude-3-5-sonnet-20241022',
         max_tokens: 2000,
         messages: [{
           role: 'user',
           content: `Como professor especialista em ${type}, corrija esta redação...`
         }]
       })
     });
     
     const data = await response.json();
     return JSON.parse(data.content[0].text);
   }
   ```

### Opção 3: Backend Próprio

Se preferir não expor API keys no frontend:

1. **Criar endpoint no seu backend:**
   ```typescript
   // backend/routes/essay.ts
   app.post('/api/essay/correct', async (req, res) => {
     const { theme, content, type } = req.body;
     
     // Chamar IA aqui
     const correction = await callOpenAI(theme, content, type);
     
     res.json(correction);
   });
   ```

2. **Atualizar `aiService.ts`:**
   ```typescript
   async correctEssay(
     theme: string,
     content: string,
     type: string = 'ENEM'
   ): Promise<EssayCorrection> {
     const response = await fetch('/api/essay/correct', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ theme, content, type })
     });
     
     return await response.json();
   }
   ```

## 🎨 Personalizações Possíveis

### Adicionar Mais Tipos de Redação
```typescript
// Em Estudos.tsx, no modal de configuração
<select value={essayData.type} onChange={...}>
  <option value="ENEM">ENEM</option>
  <option value="FUVEST">FUVEST</option>
  <option value="UNICAMP">UNICAMP</option>
  <option value="Geral">Vestibular Geral</option>
</select>
```

### Customizar Avisos do Timer
```typescript
// Modificar os tempos de aviso em Estudos.tsx
if (minutesLeft === 15 && !hasWarned15) {
  setHasWarned15(true);
  showNotification('⏰ Faltam 15 minutos!');
}
```

### Salvar Histórico de Redações
```typescript
// Adicionar ao localStorage
localStorage.setItem('essays', JSON.stringify([...essays, {
  date: new Date(),
  theme: essayData.theme,
  content: essayData.content,
  grade: correction.estimatedGrade
}]));
```

## 🚀 Próximas Melhorias Sugeridas

1. **Banco de Dados:**
   - Salvar redações e correções
   - Histórico de estudos
   - Estatísticas de progresso

2. **Gamificação:**
   - Sistema de pontos por tempo estudado
   - Badges por conquistas
   - Ranking de usuários

3. **Analytics:**
   - Gráficos de evolução
   - Relatórios de desempenho
   - Temas mais estudados

4. **Notificações:**
   - Lembretes de estudo
   - Metas diárias
   - Progresso semanal

## 📝 Notas Importantes

- O serviço atual usa dados mock para demonstração
- Para produção, implemente autenticação adequada nas chamadas de API
- Considere implementar rate limiting para evitar custos excessivos
- Valide e sanitize inputs antes de enviar para APIs externas
- Implemente tratamento de erros robusto
