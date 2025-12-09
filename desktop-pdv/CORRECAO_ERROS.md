# 🔧 Correção de Erros - PDV Desktop

## Erros Encontrados e Soluções

### ❌ Erro 1: better-sqlite3 incompatível com Electron
```
NODE_MODULE_VERSION 115 vs 119
```

**Causa:** `better-sqlite3` foi compilado para Node.js, não para Electron

**Solução:** Recompilar para Electron

### ❌ Erro 2: Tailwind CSS v4 mudou a API
```
PostCSS plugin moved to separate package
```

**Causa:** Tailwind CSS v4 usa novo plugin

**Solução:** Usar `@tailwindcss/postcss`

---

## 🚀 PASSOS PARA CORRIGIR

### 1️⃣ Limpar e reinstalar (Execute na pasta desktop-pdv):

```bash
cd desktop-pdv
rm -rf node_modules package-lock.json
npm install
```

### 2️⃣ Instalar pacotes corretos do Tailwind:

```bash
npm install -D @tailwindcss/postcss@alpha tailwindcss@next
```

### 3️⃣ Recompilar better-sqlite3 para Electron:

```bash
npm run rebuild
```

### 4️⃣ Testar:

```bash
npm run dev
```

---

## ✅ Arquivos Já Corrigidos

### ✓ `postcss.config.js`
```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### ✓ `src/index.css`
```css
@import "tailwindcss";
```

### ✓ `package.json`
- Adicionado `@tailwindcss/postcss`
- Atualizado `better-sqlite3` para v11.7.0
- Adicionado `electron-rebuild`
- Adicionado script `postinstall`

---

## 🔄 Comandos Completos (Copie e Cole):

```bash
# Na pasta desktop-pdv
cd /home/flavio/Downloads/pizzaria-zattera-ai/desktop-pdv

# Limpar tudo
rm -rf node_modules package-lock.json

# Instalar dependências
npm install

# Instalar Tailwind correto
npm install -D @tailwindcss/postcss@4.0.0-alpha.30 tailwindcss@4.0.0-alpha.30

# Recompilar SQLite
npm run rebuild

# Executar
npm run dev
```

---

## 🆘 Se ainda der erro:

### Opção A: Usar versão mais antiga do Tailwind

```bash
npm uninstall tailwindcss @tailwindcss/postcss
npm install -D tailwindcss@3.4.1 postcss autoprefixer
npx tailwindcss init -p
```

Depois alterar `src/index.css` para:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

E `postcss.config.js` para:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Opção B: Remover better-sqlite3 temporariamente

Se o SQLite continuar dando problema, podemos usar LocalStorage por enquanto:

1. Comentar linhas do SQLite em `electron.js`
2. Usar dados mock em memória
3. Testar a interface primeiro
4. Resolver SQLite depois

---

## 📝 Ordem de Prioridade:

1. ✅ **Fazer funcionar primeiro** (mesmo sem banco)
2. ✅ **Ver a interface rodando**
3. ✅ **Depois corrigir banco de dados**

Quer que eu crie uma versão SEM banco de dados para testar primeiro? Assim você vê o app funcionando e depois adicionamos o SQLite.
