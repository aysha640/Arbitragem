// ========================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ========================================

const CONFIG = {
    // URL dinâmica - funciona local e no Render
    API_ENDPOINT: window.location.origin + '/api/odds',
    REFRESH_INTERVAL: 30000, // 30 segundos
    SPORTS_MAP: {
        'soccer_brazil_campeonato': 'Futebol',
        'basketball_nba': 'Basquete',
        'tennis_atp': 'Tênis',
        'soccer': 'Futebol',
        'basketball': 'Basquete',
        'tennis': 'Tênis'
    }
};

let autoRefreshInterval = null;
let currentData = [];

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
    sportFilter: document.getElementById('sportFilter')
};

// ========================================
// FUNÇÕES PRINCIPAIS
// ========================================

/**
 * Carrega as odds do backend
 */
async function loadOdds() {
    showLoading();
    
    try {
        const response = await fetch(CONFIG.API_ENDPOINT);
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Verifica se há dados válidos
        if (!data || !Array.isArray(data)) {
            throw new Error('Formato de dados inválido');
        }
        
        currentData = data;
        processAndDisplayOdds(data);
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('Erro ao carregar odds:', error);
        showError(error.message);
    }
}

/**
 * Processa os dados e identifica surebets
 */
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

/**
 * Calcula se há surebet (arbitragem)
 * Fórmula: (1/odd1 + 1/odd2 + 1/odd3) < 1
 */
function calculateSurebet(event) {
    if (!event.bookmakers || event.bookmakers.length === 0) {
        return { isSurebet: false, profit: 0 };
    }
    
    // Encontra as melhores odds para cada outcome
    const outcomes = {};
    
    event.bookmakers.forEach(bookmaker => {
        if (bookmaker.markets && bookmaker.markets.length > 0) {
            const market = bookmaker.markets[0]; // Pega o primeiro mercado
            
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
        const profit = ((1 / inverseSum) - 1) * 100; // Lucro em porcentagem
        return { isSurebet: true, profit: profit.toFixed(2) };
    }
    
    return { isSurebet: false, profit: 0 };
}

/**
 * Exibe as odds na tela
 */
function displayOdds(events) {
    hideAllStates();
    elements.oddsGrid.style.display = 'grid';
    elements.oddsGrid.innerHTML = '';
    
    events.forEach(event => {
        const card = createOddCard(event);
        elements.oddsGrid.appendChild(card);
    });
}

/**
 * Cria um card de odd
 */
function createOddCard(event) {
    const card = document.createElement('div');
    card.className = `odd-card ${event.isSurebet ? 'surebet' : ''}`;
    
    const sportType = getSportType(event.sport_key);
    const eventTime = formatEventTime(event.commence_time);
    
    let oddsHTML = '';
    
    // Organiza as odds por bookmaker
    if (event.bookmakers && event.bookmakers.length > 0) {
        event.bookmakers.forEach(bookmaker => {
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

/**
 * Obtém o tipo de esporte formatado
 */
function getSportType(sportKey) {
    for (const [key, value] of Object.entries(CONFIG.SPORTS_MAP)) {
        if (sportKey.includes(key)) {
            return value;
        }
    }
    return 'Outro';
}

/**
 * Formata a data/hora do evento
 */
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

/**
 * Atualiza o horário da última atualização
 */
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR');
    elements.lastUpdate.textContent = timeString;
}

/**
 * Atualiza o contador de surebets
 */
function updateSurebetCount(count) {
    elements.surebetCount.textContent = count;
}

// ========================================
// FUNÇÕES DE ESTADO DA UI
// ========================================

function showLoading() {
    hideAllStates();
    elements.loadingState.style.display = 'block';
}

function showError(message) {
    hideAllStates();
    elements.errorState.style.display = 'block';
    elements.errorMessage.textContent = message || 'Erro ao carregar dados. Tente novamente.';
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

// Botão de refresh manual
elements.refreshBtn.addEventListener('click', () => {
    loadOdds();
});

// Toggle de auto-refresh
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

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Carrega os dados iniciais
    loadOdds();
    
    // Inicia o auto-refresh se estiver marcado
    if (elements.autoRefresh.checked) {
        startAutoRefresh();
    }
});

// ========================================
// TRATAMENTO DE ERROS GLOBAIS
// ========================================

window.addEventListener('error', (event) => {
    console.error('Erro global capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejeitada não tratada:', event.reason);
});
