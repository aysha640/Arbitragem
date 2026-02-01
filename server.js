// ========================================
// SERVIDOR BACKEND - NODE.JS + EXPRESS
// ========================================
// Este servidor protege suas API keys e faz as requisições
// para as APIs de odds de forma segura

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// CONFIGURAÇÃO DAS APIs
// ========================================

// IMPORTANTE: Suas API keys ficam aqui no servidor, nunca no frontend!
// No Render, use variáveis de ambiente por segurança
const API_KEYS = {
    // API 1: The Odds API
    oddsApi: process.env.ODDS_API_KEY || '8ea7e6c9-e33f-43c7-9426-4cacdbf2643d',
    
    // API 2: API-Sports ou outra API de odds
    apiSports: process.env.API_SPORTS_KEY || '9502fb08c339f1c6139300e3c5dfc3528f728901b51c427a6505d84c9acffb81'
};

// Configuração dos endpoints das APIs
const API_ENDPOINTS = {
    // The Odds API
    oddsApi: 'https://api.the-odds-api.com/v4/sports/{sport}/odds',
    
    // API-Sports (ajuste conforme necessário)
    apiSports: 'https://v3.football.api-sports.io/odds'
};

// Esportes disponíveis
const SPORTS = [
    'soccer_brazil_campeonato',
    'basketball_nba',
    'tennis_atp'
];

// ========================================
// MIDDLEWARE
// ========================================

// Habilita CORS para o frontend acessar
app.use(cors());

// Parse JSON
app.use(express.json());

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..')));

// Log de requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Faz requisição para The Odds API
 */
async function fetchOddsApi(sport) {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${API_KEYS.oddsApi}&regions=us,uk,eu&markets=h2h&oddsFormat=decimal`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Erro ao buscar ${sport} na Odds API:`, error.message);
        return [];
    }
}

/**
 * Faz requisição para API-Sports (exemplo - ajuste conforme documentação)
 */
async function fetchApiSports() {
    // NOTA: Este é um exemplo. Ajuste conforme a documentação da API que você está usando
    const url = 'https://v3.football.api-sports.io/odds/live';
    
    try {
        const response = await fetch(url, {
            headers: {
                'x-apisports-key': API_KEYS.apiSports
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Converte o formato da API-Sports para o formato padrão
        // AJUSTE CONFORME A ESTRUTURA REAL DA API
        return normalizeApiSportsData(data);
    } catch (error) {
        console.error('Erro ao buscar API-Sports:', error.message);
        return [];
    }
}

/**
 * Normaliza dados da API-Sports para o formato padrão
 * IMPORTANTE: Ajuste esta função conforme a estrutura real da sua API
 */
function normalizeApiSportsData(data) {
    if (!data || !data.response) return [];
    
    // Exemplo de conversão - AJUSTE CONFORME NECESSÁRIO
    return data.response.map(item => ({
        id: item.fixture?.id || Math.random().toString(),
        sport_key: 'soccer',
        commence_time: item.fixture?.date || new Date().toISOString(),
        home_team: item.fixture?.teams?.home?.name || 'Time Casa',
        away_team: item.fixture?.teams?.away?.name || 'Time Fora',
        bookmakers: item.bookmakers?.map(bookmaker => ({
            key: bookmaker.name?.toLowerCase().replace(/\s/g, '_') || 'unknown',
            title: bookmaker.name || 'Casa de Aposta',
            markets: [{
                key: 'h2h',
                outcomes: bookmaker.bets?.[0]?.values?.map(bet => ({
                    name: bet.value,
                    price: parseFloat(bet.odd) || 1.0
                })) || []
            }]
        })) || []
    }));
}

/**
 * Combina dados de múltiplas APIs
 */
async function fetchAllOdds() {
    try {
        // Busca dados de múltiplos esportes da primeira API
        const oddsApiPromises = SPORTS.map(sport => fetchOddsApi(sport));
        const oddsApiResults = await Promise.all(oddsApiPromises);
        
        // Combina todos os resultados
        const allOdds = oddsApiResults.flat();
        
        // Opcional: Busca da segunda API
        // const apiSportsData = await fetchApiSports();
        // allOdds.push(...apiSportsData);
        
        console.log(`Total de eventos carregados: ${allOdds.length}`);
        
        return allOdds;
    } catch (error) {
        console.error('Erro ao buscar todas as odds:', error);
        throw error;
    }
}

// ========================================
// ROTAS DA API
// ========================================

/**
 * GET /api/odds
 * Retorna todas as odds disponíveis
 */
app.get('/api/odds', async (req, res) => {
    try {
        const odds = await fetchAllOdds();
        
        res.json(odds);
    } catch (error) {
        console.error('Erro na rota /api/odds:', error);
        res.status(500).json({
            error: 'Erro ao buscar odds',
            message: error.message
        });
    }
});

/**
 * GET /api/health
 * Verifica se o servidor está funcionando
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * GET /
 * Página inicial da API
 */
app.get('/', (req, res) => {
    res.json({
        message: 'SureBet API Server',
        version: '1.0.0',
        endpoints: {
            odds: '/api/odds',
            health: '/api/health'
        }
    });
});

// ========================================
// TRATAMENTO DE ERROS
// ========================================

app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: err.message
    });
});

// ========================================
// INICIALIZAÇÃO DO SERVIDOR
// ========================================

app.listen(PORT, () => {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   🚀 SureBet Backend Server Started      ║');
    console.log('╠═══════════════════════════════════════════╣');
    console.log(`║   📡 Servidor rodando em: http://localhost:${PORT}`);
    console.log('║   🔑 API Keys protegidas                 ║');
    console.log('║   ✅ CORS habilitado                     ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('');
    console.log('Endpoints disponíveis:');
    console.log(`  - GET http://localhost:${PORT}/api/odds`);
    console.log(`  - GET http://localhost:${PORT}/api/health`);
    console.log('');
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT recebido. Encerrando servidor...');
    process.exit(0);
});
