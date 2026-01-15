# 🔧 Guia de Troubleshooting - IEduca

## ✅ Configurações Aplicadas

### 1. **Backend (Program.cs)**
- ✅ CORS configurado para AllowAll
- ✅ HTTPS Redirect desabilitado em desenvolvimento
- ✅ API rodando em: `http://localhost:5000`

### 2. **Frontend (atividadeService.ts)**
- ✅ URL da API: `http://localhost:5000/api`
- ✅ Tratamento de erros melhorado
- ✅ Logs detalhados no console

### 3. **Logs Adicionados**
- ✅ Console logs em todas as requisições
- ✅ Mensagens de erro mais descritivas

---

## 🧪 Como Testar

### Passo 1: Verificar Backend
1. Acesse: http://localhost:5000/swagger/index.html
2. Deve aparecer a interface do Swagger
3. Se não aparecer, reinicie o backend:
   ```bash
   cd ServiceIEDUCA
   dotnet run
   ```

### Passo 2: Testar Endpoints no Swagger
1. No Swagger, expanda `POST /api/AtividadeExecucoes/iniciar`
2. Clique em "Try it out"
3. Use este JSON de teste:
   ```json
   {
     "userId": 1,
     "atividadeId": 1,
     "totalQuestoes": 10
   }
   ```
4. Clique em "Execute"
5. ✅ Deve retornar Status 200/201

### Passo 3: Testar no Frontend
1. Abra o console do navegador (F12)
2. Acesse a aplicação React
3. Tente iniciar uma atividade
4. Observe os logs no console:
   - 🌐 Fazendo requisição para...
   - 📦 Dados...
   - 📡 Resposta recebida...
   - ✅ Dados recebidos... (sucesso)
   - ❌ Erro... (falha)

---

## 🐛 Possíveis Problemas e Soluções

### ❌ Erro: "Não foi possível conectar ao servidor"
**Solução:**
- Verifique se o backend está rodando
- Verifique se a porta 5000 está livre
- Tente reiniciar o backend

### ❌ Erro: "Usuário não encontrado"
**Solução:**
- Certifique-se que existe um usuário com ID 1 no banco
- Execute este SQL no banco:
  ```sql
  INSERT INTO Users (Nome, Email, Senha, Tipo, Ativo, CriadoEm)
  VALUES ('Teste', 'teste@teste.com', 'senha123', 'Aluno', 1, GETDATE());
  ```

### ❌ Erro: "Atividade não encontrada ou inativa"
**Solução:**
- Certifique-se que existe uma atividade com ID 1
- Execute este SQL no banco:
  ```sql
  INSERT INTO Atividades (Nome, Descricao, Tipo, MateriaId, Ativo, CriadoEm)
  VALUES ('Atividade Teste', 'Descrição teste', 'Exercício', 1, 1, GETDATE());
  ```

### ❌ Erro 500 no backend
**Solução:**
- Verifique os logs do terminal do backend
- Provavelmente é problema de conexão com o banco de dados
- Verifique a connection string em `appsettings.json`

### ❌ Erro de CORS
**Solução:**
- Já foi configurado, mas se persistir:
- Verifique se `app.UseCors("AllowAll")` está ANTES de `app.UseAuthorization()`
- Reinicie o backend

---

## 📊 Endpoints Disponíveis

### Iniciar Atividade
```
POST http://localhost:5000/api/AtividadeExecucoes/iniciar
Body: {
  "userId": 1,
  "atividadeId": 1,
  "totalQuestoes": 10
}
```

### Finalizar Atividade
```
PUT http://localhost:5000/api/AtividadeExecucoes/{id}/finalizar
Body: {
  "acertos": 8,
  "erros": 2,
  "nota": 8.0,
  "tempoGastoSegundos": 300
}
```

### Ver Estatísticas
```
GET http://localhost:5000/api/AtividadeExecucoes/usuario/{userId}/estatisticas
```

### Ver Histórico
```
GET http://localhost:5000/api/AtividadeExecucoes/usuario/{userId}
```

---

## ✅ Checklist de Verificação

- [ ] Backend rodando em http://localhost:5000
- [ ] Swagger acessível em http://localhost:5000/swagger
- [ ] HTTPS Redirect comentado no Program.cs
- [ ] CORS configurado corretamente
- [ ] Usuário com ID 1 existe no banco
- [ ] Atividade com ID 1 existe no banco
- [ ] Console do navegador aberto para ver logs
- [ ] Frontend rodando (npm run dev)

---

## 🔍 Logs Esperados no Console (Sucesso)

```
🌐 Fazendo requisição para: http://localhost:5000/api/AtividadeExecucoes/iniciar
📦 Dados: {userId: 1, atividadeId: 1, totalQuestoes: 10}
📡 Resposta recebida. Status: 201 Created
✅ Dados recebidos: {id: 1, userId: 1, atividadeId: 1, ...}
📤 Iniciando atividade com dados: {userId: 1, atividadeId: 1, totalQuestoes: 10}
✅ Atividade iniciada: {id: 1, userId: 1, ...}
```

---

## 📝 Próximos Passos após Resolver

1. ✅ Iniciar atividade funciona
2. ✅ Finalizar atividade funciona  
3. ✅ Gráficos consomem dados reais
4. ✅ Estatísticas aparecem corretamente

---

**Última atualização:** 13/01/2026
