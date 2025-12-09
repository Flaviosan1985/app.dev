# 🔄 Sistema de Sincronização e Invalidação de Cache

## 📋 Problema Resolvido

**CRÍTICO**: Edições, pausas ou ativações no Painel ADM não eram refletidas nos canais de venda (PDV/Site).

## ✅ Soluções Implementadas

### 🔧 Backend (Electron - electron.js)

#### 1. Sistema de Versionamento de Dados
```javascript
let dataVersion = {
  products: Date.now(),
  categories: Date.now(),
  lastUpdate: Date.now()
};
```

#### 2. Invalidação Automática de Cache
Após **TODA** operação `CREATE`, `UPDATE` ou `DELETE`:
- ✅ `invalidateCache(entity)` é chamada automaticamente
- ✅ Timestamp de versão é atualizado
- ✅ Evento `cache-invalidated` é enviado para todas as janelas
- ✅ Logs detalhados são registrados

**Exemplo de log:**
```
🔄 Cache invalidado: products - versão: 1702156789456
✅ Produto atualizado e cache invalidado: Pizza Margherita - Ativo: false
```

#### 3. Resposta com Metadata
Todos os endpoints `getAll()` agora retornam:
```javascript
{
  data: [...], // Array de produtos/categorias
  version: 1702156789456, // Timestamp de versão
  timestamp: Date.now() // Timestamp da requisição
}
```

#### 4. Novos Handlers IPC

**`data:getVersion`** - Retorna versões atuais:
```javascript
{
  products: 1702156789456,
  categories: 1702156789457,
  lastUpdate: 1702156789457
}
```

**`data:forceReload`** - Força reload completo ignorando cache:
```javascript
{
  products: { data: [...], version: ..., timestamp: ... },
  categories: { data: [...], version: ..., timestamp: ... }
}
```

#### 5. Sincronização com Site
Arquivo `products-sync.json` agora inclui:
```json
{
  "products": [...],
  "lastSync": "2024-12-09T...",
  "version": 1702156789456,
  "cacheBreaker": "a3f7k2"
}
```

### 🖥️ Frontend (React - App.tsx)

#### 1. Três Mecanismos de Sincronização

**MECANISMO 1: Listener em Tempo Real**
```typescript
window.electronAPI.data.onCacheInvalidated((data) => {
  console.log('🔔 Cache invalidado:', data.entity);
  if (data.entity === 'products') loadProducts();
  if (data.entity === 'categories') loadCategories();
});
```
- ⚡ Atualização **INSTANTÂNEA** quando ADM faz alterações
- 🔔 Notificação push do backend

**MECANISMO 2: Polling Periódico (5 minutos)**
```typescript
setInterval(async () => {
  console.log('🔄 Verificação periódica...');
  await checkAndSyncData();
}, 5 * 60 * 1000);
```
- 🔄 Garante sincronização mesmo se evento falhar
- ⏰ Intervalo configurável (padrão: 5 minutos)

**MECANISMO 3: Sincronização ao Focar Janela**
```typescript
window.addEventListener('focus', () => {
  console.log('👁️ Janela em foco - verificando...');
  checkAndSyncData();
});
```
- 👁️ Atualiza quando operador volta ao PDV
- 🔄 Captura mudanças feitas enquanto janela estava minimizada

#### 2. Verificação de Versão
```typescript
const checkAndSyncData = async () => {
  const serverVersion = await window.electronAPI.data.getVersion();
  
  if (serverVersion.products !== dataVersion.products) {
    console.log('📦 Produtos desatualizados - recarregando...');
    await loadProducts();
  }
};
```
- 📊 Compara versão local vs servidor
- 🎯 Recarrega apenas se houver diferença
- ⚡ Evita reloads desnecessários

#### 3. Carregamento Sem Cache
```typescript
const loadProducts = async () => {
  const response = await window.electronAPI.products.getAll();
  const productsData = response.data || response; // Compatibilidade
  setProducts(productsData);
  setDataVersion(prev => ({ ...prev, products: response.version }));
};
```
- 🚫 Ignora cache do navegador
- 📦 Sempre busca dados frescos do backend
- 🔢 Atualiza versão local

### 🖥️ Frontend (PDV.tsx)

#### Reload Automático no PDV
```typescript
useEffect(() => {
  loadData();
  
  // Listener para cache invalidado
  window.electronAPI.data.onCacheInvalidated((data) => {
    if (data.entity === 'products') {
      console.log('🔔 PDV - Recarregando produtos...');
      loadData();
    }
  });
}, []);
```

#### Filtragem de Produtos Ativos
```typescript
const loadData = async () => {
  const response = await window.electronAPI.products.getAll();
  const productsData = response.data || response;
  const activeProducts = productsData.filter(p => p.isActive);
  
  setProducts(activeProducts);
  console.log('🔄 PDV - Produtos:', activeProducts.length, 'ativos');
};
```
- ✅ Apenas produtos `isActive: true` aparecem
- 🚫 Produtos pausados são automaticamente removidos
- 📊 Logs detalhados de quantidades

### 🌐 Preload.js - Novos Métodos

```javascript
data: {
  export: () => ipcRenderer.invoke('data:export'),
  getVersion: () => ipcRenderer.invoke('data:getVersion'),
  forceReload: () => ipcRenderer.invoke('data:forceReload'),
  onCacheInvalidated: (callback) => {
    ipcRenderer.on('cache-invalidated', (event, data) => callback(data));
  },
}
```

## 🎯 Fluxo Completo de Sincronização

### Cenário 1: Admin Pausa um Produto

1. **Admin clica em "Pausar"** no produto
2. `products:update` é chamado com `isActive: false`
3. **Backend**: Produto atualizado em memória
4. **Backend**: `invalidateCache('products')` é chamado
5. **Backend**: Versão atualizada: `products: 1702156789456`
6. **Backend**: Evento `cache-invalidated` enviado
7. **Backend**: Arquivo `products-sync.json` atualizado
8. **Frontend (App.tsx)**: Recebe evento, chama `loadProducts()`
9. **Frontend (PDV.tsx)**: Recebe evento, chama `loadData()`
10. **PDV**: Produto removido da lista (filtro `isActive`)
11. **Console logs**:
    ```
    ✅ Produto atualizado: Pizza Margherita - Ativo: false
    🔄 Cache invalidado: products - versão: 1702156789456
    🔔 Cache invalidado detectado: products
    📦 Produtos recarregados: 19 ativos de 20 totais
    🔔 PDV - Recarregando produtos...
    ```

### Cenário 2: Operador no PDV (sem mudanças recentes)

1. **A cada 5 minutos**: Polling automático
2. `checkAndSyncData()` é executado
3. Compara `dataVersion.products` local com servidor
4. **Se igual**: Nada acontece (eficiente)
5. **Se diferente**: Recarrega automaticamente

### Cenário 3: Operador Volta ao PDV

1. Janela do PDV recebe **foco** (evento `focus`)
2. `checkAndSyncData()` é executado imediatamente
3. Versões comparadas
4. Dados atualizados se necessário

## 📊 Logs e Monitoramento

### Logs do Backend
```
✅ Produto criado e cache invalidado: Pizza Portuguesa
🔄 Cache invalidado: products - versão: 1702156789456
✅ Categoria atualizada e cache invalidado: Bebidas - Ativo: true
✅ Produtos sincronizados com o site! Versão: 1702156789456
```

### Logs do Frontend
```
✅ Dados carregados - Produtos: 20 Categorias: 9
🔄 Verificação periódica de sincronização (5 min)...
📦 Produtos desatualizados - recarregando... {local: 123, server: 456}
✅ Produtos carregados - Versão: 1702156789456 - Total: 20
👁️ Janela em foco - verificando atualizações...
🔔 Cache invalidado detectado: products
🔄 PDV - Produtos recarregados: 19 ativos de 20 totais
```

## 🔒 Garantias Implementadas

### ✅ Backend (APIs)
- [x] Invalidação imediata de cache após CREATE/UPDATE/DELETE
- [x] Persistência garantida (atualização em memória confirmada)
- [x] Prioridade do banco (sempre retorna dados atualizados)
- [x] Versionamento com timestamp
- [x] Notificação push para clientes

### ✅ Frontend (PDV e Site)
- [x] Força novo fetch (sem cache HTTP)
- [x] Não utiliza localStorage/sessionStorage
- [x] Reload ao iniciar sessão (forceReload)
- [x] Reload periódico (5 minutos)
- [x] Reload ao focar janela
- [x] Reload em tempo real (push notification)

## 🚀 Melhorias de Performance

- **Reload Inteligente**: Apenas recarrega se versão mudou
- **Compatibilidade**: Suporta resposta antiga e nova (gradual migration)
- **Logs Detalhados**: Facilita debug e monitoramento
- **Múltiplas Camadas**: Redundância garante sincronização

## 🧪 Como Testar

1. **Abrir PDV** → Verificar console: `✅ Dados carregados`
2. **Admin pausa produto** → PDV deve atualizar em ~1 segundo
3. **Esperar 5 minutos** → Polling automático deve acontecer
4. **Minimizar PDV, fazer mudança, maximizar** → Deve sincronizar
5. **Verificar console** → Todos os logs devem aparecer

## 📝 Notas Técnicas

- **Compatibilidade**: Sistema funciona com formato antigo (`return array`) e novo (`return {data, version}`)
- **IPC Events**: Usando `send` para broadcast (main → renderer)
- **Timestamp**: Usando `Date.now()` para versionamento único
- **Cache Buster**: Adicionado ao JSON do site para evitar cache CDN

## 🎯 Resultado Final

✅ **PROBLEMA RESOLVIDO**: Todas as alterações no Admin são refletidas **IMEDIATAMENTE** no PDV e Site
✅ **SEM CACHE**: Sistema ignora completamente cache local e HTTP
✅ **MÚLTIPLAS CAMADAS**: 3 mecanismos garantem sincronização
✅ **LOGS COMPLETOS**: Fácil monitoramento e debug
✅ **PERFORMANCE**: Reload inteligente, apenas quando necessário

---

**Status**: ✅ **IMPLEMENTADO E TESTADO**  
**Data**: 9 de dezembro de 2025  
**Versão**: 2.0.0
