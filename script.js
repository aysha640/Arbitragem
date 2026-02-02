// Variáveis globais
let clientes = [];
let clienteSelecionado = null;

// Carrega dados do LocalStorage ao iniciar
function carregarDados() {
    const dadosSalvos = localStorage.getItem('aysha_clientes');
    if (dadosSalvos) {
        clientes = JSON.parse(dadosSalvos);
        atualizarInterface();
    }
}

// Salva dados no LocalStorage e Firebase
async function salvarDados() {
    localStorage.setItem('aysha_clientes', JSON.stringify(clientes));
    await salvarNoFirebase();
    atualizarInterface();
}

// Salva no Firebase
async function salvarNoFirebase() {
    if (window.db && window.setDoc && window.doc) {
        try {
            await window.setDoc(window.doc(window.db, 'aysha', 'clientes'), {
                dados: clientes,
                ultimaAtualizacao: new Date().toISOString()
            });
            console.log('Dados salvos no Firebase');
        } catch (erro) {
            console.error('Erro ao salvar no Firebase:', erro);
        }
    }
}

// Carrega dados do Firebase
async function carregarDadosFirebase() {
    if (window.db && window.getDocs && window.collection) {
        try {
            const querySnapshot = await window.getDocs(window.collection(window.db, 'aysha'));
            querySnapshot.forEach((doc) => {
                if (doc.id === 'clientes' && doc.data().dados) {
                    const dadosFirebase = doc.data().dados;
                    const dadosLocal = localStorage.getItem('aysha_clientes');
                    
                    // Se não tem dados locais, usa do Firebase
                    if (!dadosLocal) {
                        clientes = dadosFirebase;
                        localStorage.setItem('aysha_clientes', JSON.stringify(clientes));
                        atualizarInterface();
                    }
                }
            });
            console.log('Dados carregados do Firebase');
        } catch (erro) {
            console.error('Erro ao carregar do Firebase:', erro);
        }
    }
    
    // Sempre carrega do LocalStorage por último
    carregarDados();
}

// Atualiza toda a interface
function atualizarInterface() {
    atualizarTotalGeral();
    mostrarListaClientes();
}

// Calcula e atualiza o total geral
function atualizarTotalGeral() {
    let totalGeral = 0;
    clientes.forEach(cliente => {
        cliente.dividas.forEach(divida => {
            totalGeral += divida.valor;
        });
    });
    
    document.getElementById('totalGeral').textContent = formatarDinheiro(totalGeral);
}

// Mostra lista de clientes
function mostrarListaClientes() {
    const container = document.getElementById('listaClientes');
    
    if (clientes.length === 0) {
        container.innerHTML = '<div class="mensagem-vazia">Nenhum cliente cadastrado ainda.<br>Clique em "Adicionar Cliente" para começar!</div>';
        return;
    }
    
    container.innerHTML = '';
    clientes.forEach((cliente, index) => {
        const totalCliente = calcularTotalCliente(cliente);
        
        const card = document.createElement('div');
        card.className = 'cliente-card';
        card.onclick = () => abrirDetalhesCliente(index);
        card.innerHTML = `
            <h3>${cliente.nome}</h3>
            <p>Dívidas: ${cliente.dividas.length}</p>
            <p class="total">Total: ${formatarDinheiro(totalCliente)}</p>
        `;
        
        container.appendChild(card);
    });
}

// Calcula total de um cliente
function calcularTotalCliente(cliente) {
    let total = 0;
    cliente.dividas.forEach(divida => {
        total += divida.valor;
    });
    return total;
}

// Formata valor em dinheiro
function formatarDinheiro(valor) {
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

// Obtém data atual formatada
function obterDataAtual() {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Modal - Adicionar Cliente
function mostrarAdicionarCliente() {
    document.getElementById('nomeNovoCliente').value = '';
    document.getElementById('modalAdicionarCliente').style.display = 'block';
    setTimeout(() => {
        document.getElementById('nomeNovoCliente').focus();
    }, 100);
}

function adicionarCliente() {
    const nome = document.getElementById('nomeNovoCliente').value.trim();
    
    if (!nome) {
        alert('Por favor, digite o nome do cliente!');
        return;
    }
    
    const novoCliente = {
        nome: nome,
        dividas: []
    };
    
    clientes.push(novoCliente);
    salvarDados();
    fecharModal('modalAdicionarCliente');
}

// Modal - Procurar Cliente
function mostrarProcurarCliente() {
    if (clientes.length === 0) {
        alert('Nenhum cliente cadastrado ainda!');
        return;
    }
    
    document.getElementById('campoBusca').value = '';
    document.getElementById('resultadosBusca').innerHTML = '';
    document.getElementById('modalProcurarCliente').style.display = 'block';
    setTimeout(() => {
        document.getElementById('campoBusca').focus();
    }, 100);
}

function buscarCliente() {
    const termo = document.getElementById('campoBusca').value.toLowerCase().trim();
    const container = document.getElementById('resultadosBusca');
    
    if (!termo) {
        container.innerHTML = '';
        return;
    }
    
    const resultados = clientes.filter((cliente, index) => {
        return cliente.nome.toLowerCase().includes(termo);
    }).map((cliente, _, arr) => {
        return clientes.indexOf(cliente);
    });
    
    if (resultados.length === 0) {
        container.innerHTML = '<div class="mensagem-vazia">Nenhum cliente encontrado</div>';
        return;
    }
    
    container.innerHTML = '';
    resultados.forEach(index => {
        const cliente = clientes[index];
        const totalCliente = calcularTotalCliente(cliente);
        
        const item = document.createElement('div');
        item.className = 'resultado-item';
        item.onclick = () => {
            fecharModal('modalProcurarCliente');
            abrirDetalhesCliente(index);
        };
        item.innerHTML = `
            <h4>${cliente.nome}</h4>
            <p>${formatarDinheiro(totalCliente)} - ${cliente.dividas.length} dívida(s)</p>
        `;
        
        container.appendChild(item);
    });
}

// Modal - Detalhes do Cliente
function abrirDetalhesCliente(index) {
    clienteSelecionado = index;
    const cliente = clientes[index];
    
    document.getElementById('nomeClienteDetalhes').textContent = cliente.nome;
    atualizarDetalhesCliente();
    document.getElementById('modalDetalhesCliente').style.display = 'block';
}

function atualizarDetalhesCliente() {
    if (clienteSelecionado === null) return;
    
    const cliente = clientes[clienteSelecionado];
    const totalCliente = calcularTotalCliente(cliente);
    
    document.getElementById('totalClienteDetalhes').textContent = formatarDinheiro(totalCliente);
    
    const container = document.getElementById('listaDividas');
    
    if (cliente.dividas.length === 0) {
        container.innerHTML = '<div class="mensagem-vazia">Nenhuma dívida registrada</div>';
        return;
    }
    
    container.innerHTML = '';
    cliente.dividas.forEach((divida, indexDivida) => {
        const item = document.createElement('div');
        item.className = 'divida-item';
        item.innerHTML = `
            <div class="data">${divida.data}</div>
            <div class="descricao">${divida.descricao}</div>
            <div class="valor">${formatarDinheiro(divida.valor)}</div>
            <button class="btn-lixeira" onclick="excluirDivida(${indexDivida})">🗑️</button>
        `;
        
        container.appendChild(item);
    });
}

// Modal - Adicionar Dívida
function mostrarAdicionarDividaCliente() {
    document.getElementById('valorDivida').value = '';
    document.getElementById('anotacaoDivida').value = '';
    document.getElementById('modalAdicionarDivida').style.display = 'block';
    setTimeout(() => {
        document.getElementById('valorDivida').focus();
    }, 100);
}

function salvarNovaDivida() {
    const valor = parseFloat(document.getElementById('valorDivida').value);
    const descricao = document.getElementById('anotacaoDivida').value.trim();
    
    if (!valor || valor <= 0) {
        alert('Por favor, digite um valor válido!');
        return;
    }
    
    if (!descricao) {
        alert('Por favor, descreva o que foi comprado!');
        return;
    }
    
    const novaDivida = {
        data: obterDataAtual(),
        descricao: descricao,
        valor: valor
    };
    
    clientes[clienteSelecionado].dividas.push(novaDivida);
    salvarDados();
    atualizarDetalhesCliente();
    fecharModal('modalAdicionarDivida');
}

// Excluir Dívida
function excluirDivida(indexDivida) {
    if (!confirm('Tem certeza que deseja excluir esta dívida?')) {
        return;
    }
    
    clientes[clienteSelecionado].dividas.splice(indexDivida, 1);
    salvarDados();
    atualizarDetalhesCliente();
}

// Modal - Pagamento
function mostrarPagamentoCliente() {
    const cliente = clientes[clienteSelecionado];
    const totalCliente = calcularTotalCliente(cliente);
    
    if (totalCliente === 0) {
        alert('Este cliente não tem dívidas!');
        return;
    }
    
    document.getElementById('infoClientePagamento').textContent = 
        `${cliente.nome} deve ${formatarDinheiro(totalCliente)}`;
    document.getElementById('valorPagamento').value = '';
    document.getElementById('modalPagamento').style.display = 'block';
    setTimeout(() => {
        document.getElementById('valorPagamento').focus();
    }, 100);
}

function registrarPagamento() {
    const valorPago = parseFloat(document.getElementById('valorPagamento').value);
    
    if (!valorPago || valorPago <= 0) {
        alert('Por favor, digite um valor válido!');
        return;
    }
    
    const cliente = clientes[clienteSelecionado];
    const totalDevendo = calcularTotalCliente(cliente);
    
    if (valorPago > totalDevendo) {
        alert(`O valor pago (${formatarDinheiro(valorPago)}) é maior que a dívida total (${formatarDinheiro(totalDevendo)})!`);
        return;
    }
    
    // Desconta das dívidas mais antigas primeiro
    let restante = valorPago;
    let i = 0;
    
    while (restante > 0 && i < cliente.dividas.length) {
        if (cliente.dividas[i].valor <= restante) {
            restante -= cliente.dividas[i].valor;
            cliente.dividas.splice(i, 1);
        } else {
            cliente.dividas[i].valor -= restante;
            restante = 0;
        }
    }
    
    salvarDados();
    atualizarDetalhesCliente();
    fecharModal('modalPagamento');
    
    const novoTotal = calcularTotalCliente(cliente);
    if (novoTotal === 0) {
        alert('Pagamento registrado! Cliente não tem mais dívidas! 🎉');
    } else {
        alert(`Pagamento registrado! Ainda faltam ${formatarDinheiro(novoTotal)}`);
    }
}

// Fechar Modal
function fecharModal(idModal) {
    document.getElementById(idModal).style.display = 'none';
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Inicialização
window.onload = function() {
    carregarDados();
    console.log('AYSHA - Sistema de Controle de Clientes iniciado');
}
