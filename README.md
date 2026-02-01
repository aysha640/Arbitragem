# 🎯 SureBet Finder - Sistema de Arbitragem Esportiva

Sistema completo para encontrar oportunidades de **surebet (arbitragem esportiva)** em tempo real, com design moderno em vermelho e preto.

---

## 📋 Índice

- [Características](#-características)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação](#-instalação)
- [Como Usar](#-como-usar)
- [Configuração das APIs](#-configuração-das-apis)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)

---

## ✨ Características

✅ **Design moderno** com cores vermelho e preto  
✅ **Proteção de API keys** - Backend seguro em Node.js  
✅ **Atualização automática** a cada 30 segundos  
✅ **Detecção de Surebets** - Identifica automaticamente oportunidades de arbitragem  
✅ **Interface responsiva** - Funciona em desktop e mobile  
✅ **Animações suaves** - Experiência de usuário premium  
✅ **Múltiplas APIs** - Suporte para várias fontes de odds  

---

## 📁 Estrutura do Projeto

```
surebet-site/
│
├── index.html              # Página principal
├── README.md              # Este arquivo
│
├── css/
│   └── style.css          # Estilos do site
│
├── js/
│   └── app.js             # Lógica do frontend
│
└── backend/
    ├── server.js          # Servidor Node.js
    ├── package.json       # Dependências do Node.js
    └── .env.example       # Exemplo de configuração
```

---

## 🚀 Instalação

### Pré-requisitos

- **Node.js** (versão 14 ou superior)
- **npm** (geralmente vem com Node.js)
- Navegador web moderno (Chrome, Firefox, Edge, etc.)

### Passo 1: Extrair os arquivos

Extraia o arquivo ZIP para uma pasta de sua escolha.

### Passo 2: Instalar dependências do backend

Abra o terminal/prompt de comando na pasta do projeto e execute:

```bash
cd backend
npm install
```

Isso instalará as seguintes dependências:
- `express` - Framework web
- `cors` - Permite requisições do frontend
- `node-fetch` - Para fazer requisições HTTP

### Passo 3: Configurar as API keys (IMPORTANTE!)

As API keys já estão configuradas no arquivo `server.js` (linhas 18-24).

Se você quiser usar o arquivo `.env` para mais segurança:

1. Renomeie `.env.example` para `.env`
2. Edite o arquivo e coloque suas API keys
3. Instale o pacote `dotenv`: `npm install dotenv`
4. No `server.js`, adicione no topo: `require('dotenv').config();`

---

## 🎮 Como Usar

### Opção 1: Execução Completa (Recomendado)

#### 1. Iniciar o backend:

```bash
cd backend
npm start
```

Você verá uma mensagem assim:
```
╔═══════════════════════════════════════════╗
║   🚀 SureBet Backend Server Started      ║
╠═══════════════════════════════════════════╣
║   📡 Servidor rodando em: http://localhost:3000
║   🔑 API Keys protegidas                 ║
║   ✅ CORS habilitado                     ║
╚═══════════════════════════════════════════╝
```

#### 2. Abrir o frontend:

Navegue de volta para a pasta raiz do projeto e abra o arquivo `index.html` no navegador:

**Windows:**
```bash
start index.html
```

**Mac:**
```bash
open index.html
```

**Linux:**
```bash
xdg-open index.html
```

Ou simplesmente **arraste o arquivo** `index.html` para o navegador.

---

### Opção 2: Usar um servidor local (alternativa)

Se preferir, pode usar um servidor HTTP simples:

```bash
# Instalar http-server globalmente (apenas uma vez)
npm install -g http-server

# Na pasta raiz do projeto, execute:
http-server -p 8080

# Depois acesse: http://localhost:8080
```

---

## 🔑 Configuração das APIs

### API 1: The Odds API

- **Chave:** `8ea7e6c9-e33f-43c7-9426-4cacdbf2643d`
- **Documentação:** https://the-odds-api.com/
- **Esportes suportados:**
  - Futebol Brasileiro
  - NBA (Basquete)
  - Tênis ATP

### API 2: API-Sports

- **Chave:** `9502fb08c339f1c6139300e3c5dfc3528f728901b51c427a6505d84c9acffb81`
- **Documentação:** https://www.api-football.com/documentation-v3
- **Nota:** Você precisa ajustar a função `fetchApiSports()` no `server.js` conforme a API específica que está usando.

### Como adicionar mais APIs:

1. Edite o arquivo `backend/server.js`
2. Adicione sua API key no objeto `API_KEYS`
3. Crie uma nova função `fetchMinhaApi()`
4. Adicione a chamada em `fetchAllOdds()`

---

## 🎯 Funcionalidades

### 1. Detecção Automática de Surebets

O sistema calcula automaticamente se há oportunidade de arbitragem usando a fórmula:

```
(1/odd1 + 1/odd2 + 1/odd3) < 1
```

Quando detectado, o card é destacado com:
- Badge verde "SUREBET X%"
- Borda verde brilhante
- Animação pulsante

### 2. Atualização Automática

- Atualiza as odds a cada **30 segundos**
- Pode ser desativado usando o switch "Auto-refresh"
- Botão "Atualizar Odds" para refresh manual

### 3. Filtros

- Filtro por esporte (Todos, Futebol, Basquete, Tênis)
- Ordenação automática (surebets aparecem primeiro)

### 4. Informações Exibidas

Para cada evento:
- Nome dos times/jogadores
- Horário do evento (em quanto tempo começa)
- Casa de apostas
- Odds para cada resultado
- Indicação visual das melhores odds

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Animações e grid layout
- **JavaScript (Vanilla)** - Lógica e manipulação do DOM
- **Google Fonts** - Tipografia (Orbitron + Rajdhani)

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **CORS** - Cross-Origin Resource Sharing
- **node-fetch** - Cliente HTTP

---

## 🎨 Personalização

### Mudar cores:

Edite o arquivo `css/style.css`, no topo você encontrará:

```css
:root {
    --color-primary: #ff0000;       /* Vermelho principal */
    --color-primary-dark: #cc0000;  /* Vermelho escuro */
    --color-secondary: #000000;     /* Preto */
    --color-success: #00ff88;       /* Verde (surebets) */
    /* ... */
}
```

### Mudar intervalo de atualização:

No arquivo `js/app.js`, linha 7:

```javascript
REFRESH_INTERVAL: 30000, // 30 segundos (em milissegundos)
```

---

## ⚠️ Avisos Importantes

1. **Limite de requisições:** As APIs de odds geralmente têm limites de requisições. Verifique os limites da sua API.

2. **API Keys:** Nunca compartilhe suas API keys publicamente! Elas estão no backend por segurança.

3. **Arbitragem:** Arbitragem esportiva pode violar os termos de serviço de algumas casas de apostas. Use com responsabilidade.

4. **Precisão:** As odds mudam rapidamente. Este sistema é uma ferramenta de apoio, sempre verifique manualmente.

---

## 🐛 Resolução de Problemas

### O backend não inicia:
```bash
# Certifique-se de que o Node.js está instalado
node --version

# Reinstale as dependências
cd backend
rm -rf node_modules
npm install
```

### As odds não aparecem:
1. Verifique se o backend está rodando
2. Abra o Console do navegador (F12) e veja se há erros
3. Teste o endpoint diretamente: http://localhost:3000/api/odds
4. Verifique suas API keys

### Erro de CORS:
- Certifique-se de que o backend está rodando
- O backend já tem CORS habilitado por padrão

---

## 📝 Próximos Passos (Sugestões)

- [ ] Adicionar calculadora de arbitragem
- [ ] Salvar surebets favoritos
- [ ] Notificações quando encontrar surebet
- [ ] Histórico de surebets
- [ ] Exportar dados para Excel/CSV
- [ ] Adicionar mais esportes
- [ ] Sistema de alertas por email/telegram

---

## 📧 Suporte

Se tiver dúvidas ou problemas:
1. Verifique este README primeiro
2. Consulte a documentação das APIs que você está usando
3. Verifique os logs do backend no terminal

---

## 📄 Licença

Este projeto é fornecido como está, sem garantias. Use por sua conta e risco.

---

**Desenvolvido com ❤️ para entusiastas de arbitragem esportiva**

🎲 Boa sorte e bons surebets!
