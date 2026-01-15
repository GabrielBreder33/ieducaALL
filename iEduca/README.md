# iEduca - Plataforma de Estudos

Aplicação React moderna com sistema de login e cronômetro de estudos.

## 🚀 Tecnologias

- React 18
- Vite
- React Router DOM
- CSS3 moderno

## 📋 Funcionalidades

- ✅ Sistema de login e cadastro
- ✅ Validação de senha com mensagens de erro
- ✅ Integração com API ASP.NET Core (http://localhost:5000)
- ✅ Cronômetro de estudos
- ✅ Design moderno e responsivo
- ✅ Proteção de rotas privadas

## 🛠️ Como usar

### 1. Instalar dependências

```bash
npm install
```

### 2. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

### 3. Certifique-se que sua API está rodando

Sua API ASP.NET Core deve estar rodando em `http://localhost:5000`

A API deve ter os seguintes endpoints:

- `POST /api/auth/login` - Login do usuário
  ```json
  {
    "email": "usuario@email.com",
    "password": "senha123"
  }
  ```

- `POST /api/auth/register` - Cadastro de novo usuário
  ```json
  {
    "name": "Nome do Usuário",
    "email": "usuario@email.com",
    "password": "senha123"
  }
  ```

## 📱 Páginas

### Login
- Email e senha
- Validação de erros
- Link para cadastro

### Cadastro
- Nome, email, senha e confirmação
- Validação de senhas
- Mensagens de sucesso/erro

### Estudos
- Cronômetro de estudos
- Botões: Começar/Pausar/Resetar
- Logout

## 🎨 Design

Interface moderna com:
- Gradientes vibrantes
- Animações suaves
- Design responsivo
- Dark theme

## 📦 Build para produção

```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`
