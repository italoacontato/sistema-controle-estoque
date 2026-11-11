# 📦 Sistema de Controle de Estoque

Sistema de controle de estoque desenvolvido para facilitar o gerenciamento de produtos, acompanhar movimentações e monitorar a quantidade disponível em estoque.

O projeto foi desenvolvido como prática de desenvolvimento web, utilizando tecnologias de frontend e backend, com armazenamento de dados em SQLite.

## 🚀 Funcionalidades

- **Dashboard:** visualização de indicadores gerais do estoque.
- **Cadastro de produtos:** registro de produtos com nome, categoria, preço, quantidade e estoque mínimo.
- **Edição e exclusão:** gerenciamento dos produtos cadastrados.
- **Entrada de mercadorias:** registro de novas quantidades no estoque.
- **Saída de mercadorias:** controle da retirada de produtos.
- **Alertas de estoque baixo:** identificação de produtos que atingiram o estoque mínimo.
- **Histórico de movimentações:** acompanhamento das entradas e saídas realizadas.
- **Relatórios:** visualização de informações e indicadores do estoque.

## 🛠️ Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Node.js
- Express
- SQLite
- Better-SQLite3

## 📁 Estrutura do projeto

```text
sistema-controle-estoque/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
├── server/
│   └── server.js
├── .gitignore
├── package.json
└── package-lock.json
```

## 💻 Como executar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/)
- npm (instalado junto com o Node.js)

### 1. Clonar o repositório

```bash
git clone https://github.com/italoacontato/sistema-controle-estoque.git
```

### 2. Acessar a pasta

```bash
cd sistema-controle-estoque
```

### 3. Instalar as dependências

```bash
npm install
```

### 4. Iniciar o servidor

```bash
node server/server.js
```

### 5. Acessar o sistema

Abra o navegador e acesse:

```text
http://localhost:3000
```

## 🗄️ Banco de dados

O projeto utiliza SQLite para armazenar os produtos e as movimentações de estoque.

O banco de dados é utilizado localmente pelo servidor e não é incluído no repositório.

## 👨‍💻 Autor

**Italo Alves**

- GitHub: [@italoacontato](https://github.com/italoacontato)

---

Desenvolvido como projeto de aprendizado em desenvolvimento web.
