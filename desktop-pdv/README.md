# 🚀 PDV Desktop - Pizzaria Zattera

Software de Ponto de Venda desktop com Electron + React + SQLite

## 📦 Instalação

```bash
cd desktop-pdv
npm install
```

## 🛠️ Dependências Adicionais

```bash
# Instalar Tailwind CSS e dependências
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/better-sqlite3
```

## ▶️ Executar em Desenvolvimento

```bash
npm run dev
```

Este comando:
1. Inicia o servidor Vite na porta 3001
2. Aguarda o servidor estar pronto
3. Inicia o Electron

## 📦 Build para Produção

### Windows
```bash
npm run build:win
```
Gera: `dist/Pizzaria Zattera PDV Setup.exe`

### Mac
```bash
npm run build:mac
```
Gera: `dist/Pizzaria Zattera PDV.dmg`

### Linux
```bash
npm run build:linux
```
Gera: `dist/pizzaria-zattera-pdv_1.0.0_amd64.deb` e `.AppImage`

## 🗂️ Estrutura do Projeto

```
desktop-pdv/
├── electron.js              # Main process (backend Electron)
├── preload.js              # Bridge seguro entre main e renderer
├── package.json            # Configurações e dependências
├── vite.config.ts          # Configuração do Vite
├── tailwind.config.js      # Configuração do Tailwind
├── index.html              # HTML principal
├── src/
│   ├── main.tsx           # Entry point React
│   ├── App.tsx            # Componente principal
│   ├── types.ts           # TypeScript types
│   ├── index.css          # Estilos globais
│   └── database/
│       └── sqlite.js      # Banco de dados local
└── build/
    └── icon.png           # Ícone do aplicativo
```

## 💾 Banco de Dados

O banco SQLite é criado automaticamente em:
- **Windows**: `%APPDATA%/pizzaria-zattera-pdv/pizzaria-zattera.db`
- **Mac**: `~/Library/Application Support/pizzaria-zattera-pdv/pizzaria-zattera.db`
- **Linux**: `~/.config/pizzaria-zattera-pdv/pizzaria-zattera.db`

## ✨ Funcionalidades

### Implementadas
- ✅ Estrutura básica do Electron
- ✅ Banco de dados SQLite local
- ✅ Interface React com Tailwind
- ✅ Listagem de produtos, pedidos, clientes
- ✅ Analytics básico
- ✅ Comunicação segura main ↔ renderer

### Em Desenvolvimento
- 🔄 PDV completo com carrinho
- 🔄 Gestão de produtos (CRUD)
- 🔄 Gestão de categorias (CRUD)
- 🔄 Sistema de impressão térmica
- 🔄 Sincronização com site (Firebase/API)
- 🔄 Atalhos de teclado
- 🔄 Controle de caixa
- 🔄 Relatórios avançados

## 🔄 Sincronização com o Site

O sistema está preparado para sincronizar com:
- Firebase Realtime Database
- API REST personalizada
- WebSockets para updates em tempo real

## 🖨️ Impressão Térmica (Futuro)

```bash
npm install electron-pos-printer
```

## 🔐 Segurança

- ✅ Context Isolation ativado
- ✅ Node Integration desabilitado
- ✅ Comunicação via IPC seguro
- ✅ Preload script com contextBridge

## 📱 Atalhos de Teclado (Planejado)

- `F1` - Nova venda
- `F2` - Buscar produto
- `F3` - Buscar cliente
- `F5` - Atualizar
- `F9` - Fechar caixa
- `Ctrl+P` - Imprimir cupom
- `Ctrl+S` - Salvar
- `Esc` - Cancelar

## 🆘 Troubleshooting

### Erro: "electron não encontrado"
```bash
npm install electron --save-dev
```

### Erro: "better-sqlite3 não compila"
```bash
npm rebuild better-sqlite3
```

### Porta 3001 já em uso
Altere em `vite.config.ts`:
```typescript
server: {
  port: 3002, // ou outra porta
}
```

## 📝 TODO

- [ ] Completar módulo PDV
- [ ] Adicionar CRUD de produtos
- [ ] Adicionar CRUD de categorias
- [ ] Implementar impressão
- [ ] Adicionar sincronização
- [ ] Testes automatizados
- [ ] Auto-update
- [ ] Dark mode

## 👨‍💻 Desenvolvimento

Para adicionar novos recursos:

1. **Adicionar handler no electron.js**
```javascript
ipcMain.handle('seu-handler', async (event, data) => {
  // lógica
});
```

2. **Expor no preload.js**
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  seuMetodo: (data) => ipcRenderer.invoke('seu-handler', data)
});
```

3. **Usar no React**
```typescript
const resultado = await window.electronAPI.seuMetodo(data);
```

## 📄 Licença

MIT
