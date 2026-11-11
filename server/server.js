
/* ========================================
   IMPORTAR DEPENDÊNCIAS
======================================== */

const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

/* ========================================
   CONFIGURAÇÕES DO SERVIDOR
======================================== */

const app = express();

const PORT = 3000;

// Permite receber dados no formato JSON
app.use(express.json());

// Conecta ao banco de dados SQLite
const db = new Database(
    path.join(__dirname, "estoque.db")
);

// Ativa as chaves estrangeiras
db.pragma("foreign_keys = ON");

/* ========================================
   CRIAR TABELAS DO BANCO DE DADOS
======================================== */

// Tabela de produtos
db.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        categoria TEXT NOT NULL,
        preco REAL NOT NULL,
        quantidade INTEGER NOT NULL,
        minimo INTEGER NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Tabela de movimentações
db.exec(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER,
        produto_nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        quantidade INTEGER NOT NULL,
        data DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (produto_id)
        REFERENCES produtos(id)
        ON DELETE SET NULL
    );
`);

/* ========================================
   ROTA DE TESTE
======================================== */

app.get("/api/status", (req, res) => {
    res.json({
        mensagem: "Servidor conectado ao SQLite!",
        banco: "Funcionando"
    });
});


/* ========================================
   ROTAS DE PRODUTOS
======================================== */

// LISTAR TODOS OS PRODUTOS
app.get("/api/produtos", (req, res) => {
    try {
        const produtos = db.prepare(`
            SELECT * FROM produtos
            ORDER BY id DESC
        `).all();

        res.json(produtos);

    } catch (error) {
        res.status(500).json({
            mensagem: "Erro ao buscar produtos."
        });
    }
});


// CADASTRAR PRODUTO
app.post("/api/produtos", (req, res) => {
    try {
        const {
            nome,
            categoria,
            preco,
            quantidade,
            minimo
        } = req.body;

        if (
            typeof nome !== "string" ||
            !nome.trim() ||
            typeof categoria !== "string" ||
            !categoria.trim() ||
            preco === undefined ||
            quantidade === undefined ||
            minimo === undefined ||
            !Number.isFinite(Number(preco)) ||
            !Number.isInteger(Number(quantidade)) ||
            !Number.isInteger(Number(minimo)) ||
            Number(preco) < 0 ||
            Number(quantidade) < 0 ||
            Number(minimo) < 0
        ) {
            return res.status(400).json({
                mensagem: "Preencha os dados do produto corretamente."
            });
        }

        const resultado = db.prepare(`
            INSERT INTO produtos (
                nome,
                categoria,
                preco,
                quantidade,
                minimo
            )
            VALUES (?, ?, ?, ?, ?)
        `).run(
            nome.trim(),
            categoria.trim(),
            Number(preco),
            Number(quantidade),
            Number(minimo)
        );

        const produto = db.prepare(`
            SELECT * FROM produtos WHERE id = ?
        `).get(resultado.lastInsertRowid);

        res.status(201).json(produto);

    } catch (error) {
        res.status(500).json({
            mensagem: "Erro ao cadastrar produto."
        });
    }
});


// EDITAR PRODUTO
app.put("/api/produtos/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        const {
            nome,
            categoria,
            preco,
            quantidade,
            minimo
        } = req.body;

        if (
            !Number.isInteger(id) ||
            id <= 0 ||
            typeof nome !== "string" ||
            !nome.trim() ||
            typeof categoria !== "string" ||
            !categoria.trim() ||
            preco === undefined ||
            quantidade === undefined ||
            minimo === undefined ||
            !Number.isFinite(Number(preco)) ||
            !Number.isInteger(Number(quantidade)) ||
            !Number.isInteger(Number(minimo)) ||
            Number(preco) < 0 ||
            Number(quantidade) < 0 ||
            Number(minimo) < 0
        ) {
            return res.status(400).json({
                mensagem: "Dados inválidos para edição."
            });
        }

        const resultado = db.prepare(`
            UPDATE produtos
            SET
                nome = ?,
                categoria = ?,
                preco = ?,
                quantidade = ?,
                minimo = ?
            WHERE id = ?
        `).run(
            nome.trim(),
            categoria.trim(),
            Number(preco),
            Number(quantidade),
            Number(minimo),
            id
        );

        if (resultado.changes === 0) {
            return res.status(404).json({
                mensagem: "Produto não encontrado."
            });
        }

        const produto = db.prepare(`
            SELECT * FROM produtos WHERE id = ?
        `).get(id);

        res.json(produto);

    } catch (error) {
        res.status(500).json({
            mensagem: "Erro ao editar produto."
        });
    }
});


// EXCLUIR PRODUTO
app.delete("/api/produtos/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID de produto inválido."
            });
        }

        const resultado = db.prepare(`
            DELETE FROM produtos WHERE id = ?
        `).run(id);

        if (resultado.changes === 0) {
            return res.status(404).json({
                mensagem: "Produto não encontrado."
            });
        }

        res.json({
            mensagem: "Produto excluído com sucesso!"
        });

    } catch (error) {
        res.status(500).json({
            mensagem: "Erro ao excluir produto."
        });
    }
});


/* ========================================
   ROTAS DE MOVIMENTAÇÕES
======================================== */

// LISTAR HISTÓRICO DE MOVIMENTAÇÕES

app.get("/api/movimentacoes", (req, res) => {

    try {

        const movimentacoes = db.prepare(`
            SELECT * FROM movimentacoes
            ORDER BY id DESC
        `).all();

        res.json(movimentacoes);

    } catch (error) {

        res.status(500).json({
            mensagem: "Erro ao buscar movimentações."
        });

    }

});


// REGISTRAR ENTRADA OU SAÍDA

app.post("/api/movimentacoes", (req, res) => {

    try {

        const { produtoId, quantidade, tipo } = req.body;

        // VALIDAR DADOS

        if (
            !Number.isInteger(Number(produtoId)) ||
            Number(produtoId) <= 0 ||
            !Number.isInteger(Number(quantidade)) ||
            Number(quantidade) <= 0 ||
            !["Entrada", "Saída"].includes(tipo)
        ) {

            return res.status(400).json({
                mensagem: "Dados da movimentação inválidos."
            });

        }

        // BUSCAR PRODUTO

        const produto = db.prepare(`
            SELECT * FROM produtos WHERE id = ?
        `).get(Number(produtoId));

        if (!produto) {

            return res.status(404).json({
                mensagem: "Produto não encontrado."
            });

        }

        const quantidadeMovimentada = Number(quantidade);

        // VERIFICAR ESTOQUE PARA SAÍDAS

        if (
            tipo === "Saída" &&
            quantidadeMovimentada > produto.quantidade
        ) {

            return res.status(400).json({
                mensagem: `Estoque insuficiente! Quantidade disponível: ${produto.quantidade}.`
            });

        }

        // EXECUTAR OPERAÇÕES EM UMA TRANSAÇÃO

        const registrarMovimentacao = db.transaction(() => {

            const novaQuantidade =
                tipo === "Entrada"
                    ? produto.quantidade + quantidadeMovimentada
                    : produto.quantidade - quantidadeMovimentada;

            // ATUALIZAR ESTOQUE

            db.prepare(`
                UPDATE produtos
                SET quantidade = ?
                WHERE id = ?
            `).run(novaQuantidade, Number(produtoId));

            // REGISTRAR HISTÓRICO

            const resultado = db.prepare(`
                INSERT INTO movimentacoes (
                    produto_id,
                    produto_nome,
                    tipo,
                    quantidade
                )
                VALUES (?, ?, ?, ?)
            `).run(
                Number(produtoId),
                produto.nome,
                tipo,
                quantidadeMovimentada
            );

            return {
                id: Number(resultado.lastInsertRowid),
                produto: produto.nome,
                quantidade: quantidadeMovimentada,
                tipo: tipo
            };

        });

        const movimentacao = registrarMovimentacao();

        res.status(201).json(movimentacao);

    } catch (error) {

        console.error("Erro na movimentação:", error);

        res.status(500).json({
            mensagem: "Não foi possível registrar a movimentação."
        });

    }

});


/* ========================================
   DISPONIBILIZAR O FRONTEND
======================================== */

app.use(express.static(path.join(__dirname, "..")));

/* ========================================
   INICIAR SERVIDOR
======================================== */

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
