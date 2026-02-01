// ========================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ========================================

const CONFIG = {
    REFRESH_INTERVAL: 30000, // 30 segundos
    SPORTS_MAP: {
        'soccer_brazil_campeonato': 'Futebol',
        'basketball_nba': 'Basquete',
        'tennis_atp': 'Tênis',
        'soccer': 'Futebol',
        'basketball': 'Basquete',
        'tennis': 'Tênis'
    },
    // Lista de esportes para buscar
    SPORTS: ['soccer_brazil_campeonato', 'basketball_nba', 'tennis_atp']
};

let autoRefreshInterval = null;
let currentData = [];
let apiKeys = {
    key1: '8ea7e6c9-e33f-43c7-9426-4cacdbf2643d', // Padrão
    key2: null
};

// ========================================
// ELEMENTOS DO DOM
// ========================================

const elements = {
    oddsGrid: document.getElementById('oddsGrid'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    emptyState: document.getElementById('emptyState'),
    errorMessage: document.getElementById('errorMessage'),
    lastUpdate: document.getElementById('lastUpdate'),
    surebetCount: document.getElementById('surebetCount'),
    refreshBtn: document.getElementById('refreshBtn'),
    autoRefresh: document.getElementById('autoRefresh'),
    sportFilter: document.getElementById('sportFilter'),
    configBtn: document.getElementById('configBtn'),
    configModal: document.getElementById('configModal'),
    apiKey1Input: document.getElementById('apiKey1'),
    apiKey2Input: document.getElementById('apiKey2'),
    saveConfigBtn: document.getElementById('saveConfig')
};

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Carrega API keys salvas
    loadApiKeys();
    
    // Carrega os dados iniciais
    loadOdds();
    
    // Inicia o auto-refresh se estiver marcado
    if (elements.autoRefresh.checked) {
        startAutoRefresh();
    }
    
    // Event Listeners
    setupEventListeners();
});

// ========================================
// API KEYS - GERENCIAMENTO
// ========================================

function loadApiKeys() {
    const saved = localStorage.getItem('surebet_api_keys');
    if (saved) {
        apiKeys = JSON.parse(saved);
        elements.apiKey1Input.value = apiKeys.key1 || '';
        elements.apiKey2Input.value = apiKeys.key2 || '';
    }
}

function saveApiKeys() {
    apiKeys.key1 = elements.apiKey1Input.value.trim();
    apiKeys.key2 = elements.apiKey2Input.value.trim();
    
    if (!apiKeys.key1) {
        alert('Por favor, insira pelo menos a API Key 1!');
        return;
    }
    
    localStorage.setItem('surebet_api_keys', JSON.stringify(apiKeys));
    elements.configModal.style.display = 'none';
    alert('✅ API Keys salvas com sucesso!\nClique em "Atualizar Odds" para buscar novos dados.');
}

// ========================================
// BUSCAR ODDS DAS APIs
// ========================================

async function loadOdds() {
    showLoading();
    
    try {
        if (!apiKeys.key1) {
            throw new Error('Configure sua API key primeiro! Clique em "Configurar API"');
        }
        
        const allOdds = [];
        
        // Busca de cada esporte
        for (const sport of CONFIG.SPORTS) {
            try {
                const odds = await fetchOddsFromApi(sport, apiKeys.key1);
                if (odds && odds.length > 0) {
                    allOdds.push(...odds);
                }
            } catch (error) {
                console.error(`Erro ao buscar ${sport}:`, error.message);
            }
        }
        
        if (allOdds.length === 0) {
            throw new Error('Nenhum dado retornado. Verifique sua API key ou tente novamente mais tarde.');
        }
        
        currentData = allOdds;
        processAndDisplayOdds(allOdds);
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('Erro ao carregar odds:', error);
        showError(error.message);
    }
}

async function fetchOddsFromApi(sport, apiKey) {
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${apiKey}&regions=us,uk,eu&markets=h2h&oddsFormat=decimal`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('API Key inválida! Verifique sua chave.');
        } else if (response.status === 429) {
            throw new Error('Limite de requisições atingido. Aguarde ou troque a API key.');
        }
        throw new Error(`Erro na API: ${response.status}`);
    }
    
    // Mostra uso de requisições restantes
    const remaining = response.headers.get('x-requests-remaining');
    if (remaining) {
        console.log(`📊 Requisições restantes: ${remaining}`);
    }
    
    return await response.json();
}

// ========================================
// PROCESSAR E EXIBIR DADOS
// ========================================

function processAndDisplayOdds(data) {
    if (!data || data.length === 0) {
        showEmpty();
        return;
    }
    
    // Processa cada evento e identifica surebets
    const processedEvents = data.map(event => {
        const surebet = calculateSurebet(event);
        return {
            ...event,
            isSurebet: surebet.isSurebet,
            profit: surebet.profit
        };
    });
    
    // Ordena: surebets primeiro
    processedEvents.sort((a, b) => {
        if (a.isSurebet && !b.isSurebet) return -1;
        if (!a.isSurebet && b.isSurebet) return 1;
        return 0;
    });
    
    displayOdds(processedEvents);
    updateSurebetCount(processedEvents.filter(e => e.isSurebet).length);
}

function calculateSurebet(event) {
    if (!event.bookmakers || event.bookmakers.length === 0) {
        return { isSurebet: false, profit: 0 };
    }
    
    // Encontra as melhores odds para cada outcome
    const outcomes = {};
    
    event.bookmakers.forEach(bookmaker => {
        if (bookmaker.markets && bookmaker.markets.length > 0) {
            const market = bookmaker.markets[0];
            
            if (market.outcomes) {
                market.outcomes.forEach(outcome => {
                    if (!outcomes[outcome.name] || outcome.price > outcomes[outcome.name].price) {
                        outcomes[outcome.name] = {
                            price: outcome.price,
                            bookmaker: bookmaker.title
                        };
                    }
                });
            }
        }
    });
    
    const oddsValues = Object.values(outcomes).map(o => o.price);
    
    if (oddsValues.length < 2) {
        return { isSurebet: false, profit: 0 };
    }
    
    // Calcula a soma inversa das odds
    const inverseSum = oddsValues.reduce((sum, odd) => sum + (1 / odd), 0);
    
    if (inverseSum < 1) {
        const profit = ((1 / inverseSum) - 1) * 100;
        return { isSurebet: true, profit: profit.toFixed(2) };
    }
    
    return { isSurebet: false, profit: 0 };
}

function displayOdds(events) {
    hideAllStates();
    elements.oddsGrid.style.display = 'grid';
    elements.oddsGrid.innerHTML = '';
    
    events.forEach(event => {
        const card = createOddCard(event);
        elements.oddsGrid.appendChild(card);
    });
}

function createOddCard(event) {
    const card = document.createElement('div');
    card.className = `odd-card ${event.isSurebet ? 'surebet' : ''}`;
    
    const sportType = getSportType(event.sport_key);
    const eventTime = formatEventTime(event.commence_time);
    
    let oddsHTML = '';
    
    if (event.bookmakers && event.bookmakers.length > 0) {
        event.bookmakers.slice(0, 5).forEach(bookmaker => {
            if (bookmaker.markets && bookmaker.markets.length > 0) {
                const market = bookmaker.markets[0];
                
                if (market.outcomes && market.outcomes.length > 0) {
                    market.outcomes.forEach(outcome => {
                        oddsHTML += `
                            <div class="odds-row">
                                <div class="bookmaker">${bookmaker.title}</div>
                                <div class="outcome">${outcome.name}</div>
                                <div class="odd-value">${outcome.price.toFixed(2)}</div>
                            </div>
                        `;
                    });
                }
            }
        });
    }
    
    card.innerHTML = `
        ${event.isSurebet ? `<div class="surebet-badge">SUREBET ${event.profit}%</div>` : ''}
        
        <div class="card-header">
            <span class="sport-tag">${sportType}</span>
            <h3 class="event-name">${event.home_team} vs ${event.away_team}</h3>
            <p class="event-time">${eventTime}</p>
        </div>
        
        <div class="odds-table">
            ${oddsHTML || '<p style="text-align: center; color: var(--color-text-secondary);">Sem odds disponíveis</p>'}
        </div>
    `;
    
    return card;
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function getSportType(sportKey) {
    for (const [key, value] of Object.entries(CONFIG.SPORTS_MAP)) {
        if (sportKey.includes(key)) {
            return value;
        }
    }
    return 'Outro';
}

function formatEventTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = date - now;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `Em ${days} dia${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `Em ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
        return 'Em breve';
    }
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR');
    elements.lastUpdate.textContent = timeString;
}

function updateSurebetCount(count) {
    elements.surebetCount.textContent = count;
}

// ========================================
// ESTADOS DA UI
// ========================================

function showLoading() {
    hideAllStates();
    elements.loadingState.style.display = 'block';
}

function showError(message) {
    hideAllStates();
    elements.errorState.style.display = 'block';
    elements.errorMessage.textContent = message || 'Erro ao carregar dados.';
}

function showEmpty() {
    hideAllStates();
    elements.emptyState.style.display = 'block';
}

function hideAllStates() {
    elements.loadingState.style.display = 'none';
    elements.errorState.style.display = 'none';
    elements.emptyState.style.display = 'none';
    elements.oddsGrid.style.display = 'none';
}

// ========================================
// AUTO-REFRESH
// ========================================

function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(() => {
        loadOdds();
    }, CONFIG.REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Botão de refresh
    elements.refreshBtn.addEventListener('click', () => {
        loadOdds();
    });
    
    // Auto-refresh toggle
    elements.autoRefresh.addEventListener('change', (e) => {
        if (e.target.checked) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    });
    
    // Filtro de esporte
    elements.sportFilter.addEventListener('change', (e) => {
        const sport = e.target.value;
        
        if (sport === 'all') {
            processAndDisplayOdds(currentData);
        } else {
            const filtered = currentData.filter(event => 
                event.sport_key.includes(sport)
            );
            processAndDisplayOdds(filtered);
        }
    });
    
    // Modal de configuração
    elements.configBtn.addEventListener('click', () => {
        elements.configModal.style.display = 'block';
    });
    
    // Fechar modal
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        elements.configModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === elements.configModal) {
            elements.configModal.style.display = 'none';
        }
    });
    
    // Salvar configuração
    elements.saveConfigBtn.addEventListener('click', saveApiKeys);
}

// ========================================
// TRATAMENTO DE ERROS GLOBAIS
// ========================================

window.addEventListener('error', (event) => {
    console.error('Erro global capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejeitada:', event.reason);
});
