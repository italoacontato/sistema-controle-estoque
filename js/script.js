
/* ========================================
   ELEMENTOS DO HTML
======================================== */

// PRODUTOS

const productForm = document.getElementById("product-form");

const productName = document.getElementById("product-name");
const productCategory = document.getElementById("product-category");
const productPrice = document.getElementById("product-price");
const productQuantity = document.getElementById("product-quantity");
const productMinimum = document.getElementById("product-minimum");

const productList = document.getElementById("product-list");
const productCount = document.getElementById("product-count");

const btnSubmit = document.getElementById("btn-submit");
const btnCancel = document.getElementById("btn-cancel");

// ENTRADAS

const entryForm = document.getElementById("entry-form");
const entryProduct = document.getElementById("entry-product");
const entryQuantity = document.getElementById("entry-quantity");

// SAÍDAS

const exitForm = document.getElementById("exit-form");
const exitProduct = document.getElementById("exit-product");
const exitQuantity = document.getElementById("exit-quantity");

// HISTÓRICO

const movementList = document.getElementById("movement-list");

// FILTRO DE MOVIMENTAÇÕES

const movementFilter = document.getElementById("movement-filter");

// RELATÓRIOS

const reportList = document.getElementById("report-list");


/* ========================================
   DATA ATUAL
======================================== */

const dataAtual = document.getElementById("data-atual");
const anoAtual = document.getElementById("ano-atual");

const hoje = new Date();

dataAtual.textContent = hoje.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
});

anoAtual.textContent = hoje.getFullYear();


/* ========================================
   LISTAS DO SISTEMA
======================================== */

let produtos = [];

let movimentacoes = [];

let produtoEditando = null;


/* ========================================
   CONEXÃO COM O BANCO DE DADOS
======================================== */

// CONVERTER DADOS DO SQLITE PARA O JAVASCRIPT

function normalizarProduto(produto) {

    return {
        id: produto.id,
        nome: produto.nome,
        categoria: produto.categoria,
        preco: Number(produto.preco),
        quantidade: Number(produto.quantidade),
        minimo: Number(produto.minimo)
    };

}


// CARREGAR PRODUTOS DO BANCO

async function carregarProdutos() {

    try {

        const resposta = await fetch("/api/produtos");

        if (!resposta.ok) {
            throw new Error("Erro ao carregar produtos.");
        }

        const dados = await resposta.json();

        produtos = dados.map(normalizarProduto);

        renderizarProdutos();
        atualizarDashboard();

    } catch (erro) {

        console.error("Erro:", erro);

        alert("Não foi possível carregar os produtos do banco de dados.");

    }

}


/* ========================================
   CARREGAR MOVIMENTAÇÕES DO BANCO
======================================== */

async function carregarMovimentacoes() {

    try {

        const resposta = await fetch("/api/movimentacoes");

        if (!resposta.ok) {
            throw new Error("Erro ao carregar movimentações.");
        }

        const dados = await resposta.json();

        movimentacoes = dados.map(function (item) {

            return {
                id: item.id,
                produto: item.produto_nome,
                quantidade: Number(item.quantidade),
                tipo: item.tipo,
                data: new Date(
                    item.data.replace(" ", "T") + "Z"
                ).toLocaleString("pt-BR")
            };

        });

        renderizarMovimentacoes();
        atualizarDashboard();

    } catch (erro) {

        console.error("Erro:", erro);

        alert("Não foi possível carregar o histórico.");

    }

}


/* ========================================
   CADASTRAR E EDITAR PRODUTO
======================================== */

productForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const nome = productName.value.trim();
    const categoria = productCategory.value;
    const preco = Number(productPrice.value);
    const quantidade = Number(productQuantity.value);
    const minimo = Number(productMinimum.value);

    if (
        !nome ||
        !categoria ||
        !Number.isFinite(preco) ||
        !Number.isInteger(quantidade) ||
        !Number.isInteger(minimo) ||
        preco <= 0 ||
        quantidade < 0 ||
        minimo < 0
    ) {

        alert("Verifique os dados informados.");
        return;

    }

    const produto = {
        nome,
        categoria,
        preco,
        quantidade,
        minimo
    };

    try {

        let resposta;

        // EDITAR PRODUTO

        if (produtoEditando !== null) {

            resposta = await fetch(
                `/api/produtos/${produtoEditando}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(produto)
                }
            );

        } else {

            // CADASTRAR PRODUTO

            resposta = await fetch("/api/produtos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(produto)
            });

        }

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.mensagem);
        }

        const produtoSalvo = normalizarProduto(resultado);

        if (produtoEditando !== null) {

            const indice = produtos.findIndex(function (item) {
                return item.id === produtoEditando;
            });

            produtos[indice] = produtoSalvo;

            cancelarEdicao();

            alert("Produto atualizado com sucesso!");

        } else {

            produtos.push(produtoSalvo);

            productForm.reset();

            alert("Produto cadastrado com sucesso!");

        }

        renderizarProdutos();
        atualizarDashboard();

    } catch (erro) {

        console.error("Erro:", erro);

        alert(erro.message || "Não foi possível salvar o produto.");

    }

});


/* ========================================
   EXIBIR PRODUTOS
======================================== */

function renderizarProdutos() {

    productList.replaceChildren();

    if (produtos.length === 0) {

        const linha = document.createElement("tr");
        const coluna = document.createElement("td");

        coluna.colSpan = 7;
        coluna.className = "empty-message";
        coluna.textContent = "Nenhum produto cadastrado.";

        linha.appendChild(coluna);
        productList.appendChild(linha);

    } else {

        produtos.forEach(function (produto) {

            const linha = document.createElement("tr");

            const statusBaixo = produto.quantidade <= produto.minimo;

            const dados = [
                produto.nome,
                produto.categoria,
                produto.preco.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                }),
                produto.quantidade,
                produto.minimo
            ];

            dados.forEach(function (valor) {

                const coluna = document.createElement("td");
                coluna.textContent = valor;

                linha.appendChild(coluna);

            });

            // STATUS

            const colunaStatus = document.createElement("td");
            const status = document.createElement("span");

            status.classList.add("status");

            if (statusBaixo) {
                status.classList.add("status-low");
                status.textContent = "Estoque baixo";
            } else {
                status.classList.add("status-normal");
                status.textContent = "Normal";
            }

            colunaStatus.appendChild(status);
            linha.appendChild(colunaStatus);

            // AÇÕES

            const colunaAcoes = document.createElement("td");

            const btnEdit = document.createElement("button");

            btnEdit.type = "button";
            btnEdit.className = "btn-edit";
            btnEdit.innerHTML = '<i class="bi bi-pencil"></i>';
            btnEdit.title = "Editar produto";

            btnEdit.addEventListener("click", function () {
                editarProduto(produto.id);
            });

            const btnDelete = document.createElement("button");

            btnDelete.type = "button";
            btnDelete.className = "btn-delete";
            btnDelete.innerHTML = '<i class="bi bi-trash"></i>';
            btnDelete.title = "Excluir produto";

            btnDelete.addEventListener("click", function () {
                excluirProduto(produto.id);
            });

            colunaAcoes.appendChild(btnEdit);
            colunaAcoes.appendChild(btnDelete);

            linha.appendChild(colunaAcoes);

            productList.appendChild(linha);

        });

    }

    productCount.textContent =
        produtos.length === 1
            ? "1 produto"
            : `${produtos.length} produtos`;

    atualizarSelectProdutos();

}


/* ========================================
   EDITAR PRODUTO
======================================== */

function editarProduto(id) {

    const produto = produtos.find(function (item) {
        return item.id === id;
    });

    if (!produto) return;

    produtoEditando = id;

    productName.value = produto.nome;
    productCategory.value = produto.categoria;
    productPrice.value = produto.preco;
    productQuantity.value = produto.quantidade;
    productMinimum.value = produto.minimo;

    btnSubmit.innerHTML =
        '<i class="bi bi-check-circle"></i> Salvar alterações';

    btnCancel.hidden = false;

    document.getElementById("produtos").scrollIntoView({
        behavior: "smooth"
    });

}


/* ========================================
   CANCELAR EDIÇÃO
======================================== */

function cancelarEdicao() {

    produtoEditando = null;

    productForm.reset();

    btnSubmit.innerHTML =
        '<i class="bi bi-plus-circle"></i> Cadastrar produto';

    btnCancel.hidden = true;

}

btnCancel.addEventListener("click", cancelarEdicao);


/* ========================================
   EXCLUIR PRODUTO
======================================== */

async function excluirProduto(id) {

    const produto = produtos.find(function (item) {
        return item.id === id;
    });

    if (!produto) return;

    const confirmar = confirm(
        `Deseja realmente excluir o produto "${produto.nome}"?`
    );

    if (!confirmar) return;

    try {

        const resposta = await fetch(`/api/produtos/${id}`, {
            method: "DELETE"
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.mensagem);
        }

        produtos = produtos.filter(function (item) {
            return item.id !== id;
        });

        if (produtoEditando === id) {
            cancelarEdicao();
        }

        renderizarProdutos();
        atualizarDashboard();

        alert("Produto excluído com sucesso!");

    } catch (erro) {

        console.error("Erro:", erro);

        alert(erro.message || "Não foi possível excluir o produto.");

    }

}

/* ========================================
   ATUALIZAR LISTAS DE PRODUTOS
   NOS FORMULÁRIOS DE ENTRADA E SAÍDA
======================================== */

function atualizarSelectProdutos() {

    // LISTA DE ENTRADA

    const valorEntrada = entryProduct.value;

    entryProduct.replaceChildren();

    const opcaoEntrada = document.createElement("option");

    opcaoEntrada.value = "";
    opcaoEntrada.textContent = "Selecione um produto";

    entryProduct.appendChild(opcaoEntrada);

    // LISTA DE SAÍDA

    const valorSaida = exitProduct.value;

    exitProduct.replaceChildren();

    const opcaoSaida = document.createElement("option");

    opcaoSaida.value = "";
    opcaoSaida.textContent = "Selecione um produto";

    exitProduct.appendChild(opcaoSaida);

    // ADICIONAR PRODUTOS NAS DUAS LISTAS

    produtos.forEach(function (produto) {

        const opcaoEntradaProduto = document.createElement("option");

        opcaoEntradaProduto.value = produto.id;
        opcaoEntradaProduto.textContent = produto.nome;

        entryProduct.appendChild(opcaoEntradaProduto);

        const opcaoSaidaProduto = document.createElement("option");

        opcaoSaidaProduto.value = produto.id;
        opcaoSaidaProduto.textContent = produto.nome;

        exitProduct.appendChild(opcaoSaidaProduto);

    });

    // PRESERVAR SELEÇÃO DA ENTRADA

    const entradaExiste = produtos.some(function (produto) {
        return String(produto.id) === valorEntrada;
    });

    if (entradaExiste) {
        entryProduct.value = valorEntrada;
    }

    // PRESERVAR SELEÇÃO DA SAÍDA

    const saidaExiste = produtos.some(function (produto) {
        return String(produto.id) === valorSaida;
    });

    if (saidaExiste) {
        exitProduct.value = valorSaida;
    }

}



/* ========================================
   REGISTRAR ENTRADA DE MERCADORIAS
======================================== */

entryForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const idProduto = Number(entryProduct.value);
    const quantidadeRecebida = Number(entryQuantity.value);

    if (!Number.isInteger(idProduto) || idProduto <= 0) {
        alert("Selecione um produto válido.");
        return;
    }

    if (
        !Number.isInteger(quantidadeRecebida) ||
        quantidadeRecebida <= 0
    ) {
        alert("Informe uma quantidade válida.");
        return;
    }

    try {

        const resposta = await fetch("/api/movimentacoes", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                produtoId: idProduto,
                quantidade: quantidadeRecebida,
                tipo: "Entrada"
            })

        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.mensagem);
        }

        await carregarProdutos();
        await carregarMovimentacoes();

        entryForm.reset();

        alert("Entrada registrada com sucesso!");

    } catch (erro) {

        console.error("Erro:", erro);

        alert(erro.message || "Não foi possível registrar a entrada.");

    }

});




/* ========================================
   REGISTRAR SAÍDA DE MERCADORIAS
======================================== */

exitForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const idProduto = Number(exitProduct.value);
    const quantidadeRetirada = Number(exitQuantity.value);

    if (!Number.isInteger(idProduto) || idProduto <= 0) {
        alert("Selecione um produto válido.");
        return;
    }

    if (
        !Number.isInteger(quantidadeRetirada) ||
        quantidadeRetirada <= 0
    ) {
        alert("Informe uma quantidade válida.");
        return;
    }

    try {

        const resposta = await fetch("/api/movimentacoes", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                produtoId: idProduto,
                quantidade: quantidadeRetirada,
                tipo: "Saída"
            })

        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.mensagem);
        }

        await carregarProdutos();
        await carregarMovimentacoes();

        exitForm.reset();

        alert("Saída registrada com sucesso!");

    } catch (erro) {

        console.error("Erro:", erro);

        alert(erro.message || "Não foi possível registrar a saída.");

    }

});




/* ========================================
   EXIBIR HISTÓRICO DE MOVIMENTAÇÕES
======================================== */

function renderizarMovimentacoes() {

    movementList.replaceChildren();

    const filtro = movementFilter.value;

    // APLICAR FILTRO

    const movimentacoesFiltradas = movimentacoes.filter(
        function (movimentacao) {

            return filtro === "Todas" ||
                movimentacao.tipo === filtro;

        }
    );

    // VERIFICAR SE EXISTEM MOVIMENTAÇÕES

    if (movimentacoesFiltradas.length === 0) {

        const linha = document.createElement("tr");
        const coluna = document.createElement("td");

        coluna.colSpan = 4;
        coluna.className = "empty-message";

        coluna.textContent =
            movimentacoes.length === 0
                ? "Nenhuma movimentação registrada."
                : "Nenhuma movimentação encontrada para este filtro.";

        linha.appendChild(coluna);
        movementList.appendChild(linha);

        return;

    }

    // EXIBIR MOVIMENTAÇÕES

    movimentacoesFiltradas.forEach(function (movimentacao) {

        const linha = document.createElement("tr");

        const dados = [
            movimentacao.produto,
            movimentacao.quantidade,
            movimentacao.data
        ];

        dados.forEach(function (valor) {

            const coluna = document.createElement("td");

            coluna.textContent = valor;

            linha.appendChild(coluna);

        });

        // TIPO DE MOVIMENTAÇÃO

        const colunaTipo = document.createElement("td");

        const tipo = document.createElement("span");

        tipo.className = "movement-type";

        if (movimentacao.tipo === "Saída") {
            tipo.classList.add("saida");
        } else {
            tipo.classList.add("entrada");
        }

        tipo.textContent = movimentacao.tipo;

        colunaTipo.appendChild(tipo);
        linha.appendChild(colunaTipo);

        movementList.appendChild(linha);

    });

}



/* ========================================
   ATUALIZAR RELATÓRIOS
======================================== */

function atualizarRelatorios() {

    // CALCULAR ENTRADAS E SAÍDAS

    const totalEntradas = movimentacoes
        .filter(function (movimentacao) {
            return movimentacao.tipo === "Entrada";
        })
        .reduce(function (total, movimentacao) {
            return total + movimentacao.quantidade;
        }, 0);

    const totalSaidas = movimentacoes
        .filter(function (movimentacao) {
            return movimentacao.tipo === "Saída";
        })
        .reduce(function (total, movimentacao) {
            return total + movimentacao.quantidade;
        }, 0);

    // CALCULAR VALOR DO ESTOQUE

    const valorTotalEstoque = produtos.reduce(
        function (total, produto) {
            return total + (produto.preco * produto.quantidade);
        },
        0
    );

    // ATUALIZAR INDICADORES

    document.getElementById("total-entradas").textContent =
        totalEntradas;

    document.getElementById("total-saidas").textContent =
        totalSaidas;

    document.getElementById("valor-total-estoque").textContent =
        valorTotalEstoque.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    // ATUALIZAR TABELA

    renderizarRelatorioProdutos();

}


/* ========================================
   EXIBIR RELATÓRIO DE PRODUTOS
======================================== */

function renderizarRelatorioProdutos() {

    reportList.replaceChildren();

    if (produtos.length === 0) {

        const linha = document.createElement("tr");
        const coluna = document.createElement("td");

        coluna.colSpan = 5;
        coluna.className = "empty-message";
        coluna.textContent = "Nenhum produto cadastrado.";

        linha.appendChild(coluna);
        reportList.appendChild(linha);

        return;

    }

    produtos.forEach(function (produto) {

        const linha = document.createElement("tr");

        const valorTotal = produto.preco * produto.quantidade;

        const dados = [
            produto.nome,
            produto.categoria,
            produto.quantidade,
            produto.preco.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            }),
            valorTotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            })
        ];

        dados.forEach(function (valor) {

            const coluna = document.createElement("td");

            coluna.textContent = valor;

            linha.appendChild(coluna);

        });

        reportList.appendChild(linha);

    });

}



/* ========================================
   ATUALIZAR DASHBOARD
======================================== */


/* ========================================
   ATUALIZAR DASHBOARD E ALERTAS
======================================== */

function atualizarDashboard() {

    const totalProdutos = produtos.length;

    const totalItens = produtos.reduce(function (total, produto) {
        return total + produto.quantidade;
    }, 0);

    const estoqueBaixo = produtos.filter(function (produto) {
        return produto.quantidade <= produto.minimo;
    }).length;

    // ATUALIZAR DASHBOARD

    document.getElementById("total-produtos").textContent =
        totalProdutos;

    document.getElementById("total-itens").textContent =
        totalItens;

    document.getElementById("estoque-baixo").textContent =
        estoqueBaixo;

    document.getElementById("total-movimentacoes").textContent =
        movimentacoes.length;

    document.getElementById("resumo-produtos").textContent =
        totalProdutos;

    document.getElementById("resumo-itens").textContent =
        totalItens;

    // ATUALIZAR ALERTAS

    renderizarAlertas();

    atualizarRelatorios();
}


/* ========================================
   EXIBIR ALERTAS DE ESTOQUE
======================================== */

function renderizarAlertas() {

    const alertList = document.getElementById("alert-list");
    const alertCount = document.getElementById("alert-count");

    // FILTRAR PRODUTOS COM ESTOQUE BAIXO

    const produtosBaixos = produtos.filter(function (produto) {
        return produto.quantidade <= produto.minimo;
    });

    // ATUALIZAR CONTADOR

    alertCount.textContent = produtosBaixos.length;

    alertList.replaceChildren();

    // VERIFICAR SE EXISTEM ALERTAS

    if (produtosBaixos.length === 0) {

        const linha = document.createElement("tr");
        const coluna = document.createElement("td");

        coluna.colSpan = 5;
        coluna.className = "empty-message";
        coluna.textContent = "Nenhum produto precisa de reposição.";

        linha.appendChild(coluna);
        alertList.appendChild(linha);

        return;

    }

    // EXIBIR PRODUTOS COM ESTOQUE BAIXO

    produtosBaixos.forEach(function (produto) {

        const linha = document.createElement("tr");

        const dados = [
            produto.nome,
            produto.categoria,
            produto.quantidade,
            produto.minimo
        ];

        dados.forEach(function (valor) {

            const coluna = document.createElement("td");

            coluna.textContent = valor;

            linha.appendChild(coluna);

        });

        // SITUAÇÃO DO ESTOQUE

        const colunaStatus = document.createElement("td");

        const status = document.createElement("span");

        status.className = "alert-status";

        if (produto.quantidade === 0) {

            status.classList.add("critical");
            status.textContent = "Sem estoque";

        } else {

            status.textContent = "Reposição necessária";

        }

        colunaStatus.appendChild(status);
        linha.appendChild(colunaStatus);

        alertList.appendChild(linha);

    });

}

/* ========================================
   INICIALIZAÇÃO
======================================== */

renderizarMovimentacoes();
atualizarDashboard();

carregarProdutos();
carregarMovimentacoes();

/* ========================================
   FILTRAR MOVIMENTAÇÕES
======================================== */

movementFilter.addEventListener("change", function () {

    renderizarMovimentacoes();

});
