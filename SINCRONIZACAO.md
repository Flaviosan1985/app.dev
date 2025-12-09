# Sistema de Sincronização Automática PDV ↔ Site

## 🔄 Como Funciona

### Arquitetura da Sincronização

O sistema usa arquivos JSON como ponte de comunicação entre o PDV (Electron) e o Site (Next.js):

```
PDV (Electron)           Arquivos JSON           Site (Next.js)
     ↓                        ↓                        ↓
  produtos     →    products-sync.json    →    API /api/products
  clientes     →    customers-sync.json   →    API /api/customers
  pedidos      →    orders-sync.json      →    API /api/orders
     ↑                        ↑                        ↑
  pedidos      ←  orders-from-website.json ←   POST /api/orders
```

## 📁 Arquivos de Sincronização

### `/public/products-sync.json`
```json
{
  "products": [
    {
      "id": "1",
      "name": "Pizza Margherita",
      "price": 45.90,
      "priceSmall": 32.90,
      "category": "pizzas",
      "type": "product"
    }
  ],
  "lastSync": "2025-12-09T..."
}
```

### `/public/customers-sync.json`
Dados dos clientes cadastrados no PDV

### `/public/orders-sync.json`
Histórico de pedidos do PDV para exibir no site

### `/public/orders-from-website.json`
Novos pedidos criados no site aguardando importação pelo PDV

## ⚡ Sincronização Automática

### No PDV (Electron):

1. **Sincronização Imediata**
   - Ao criar/editar produto → Sincroniza instantaneamente
   - Ao criar/editar cliente → Sincroniza instantaneamente
   - Ao criar pedido → Sincroniza instantaneamente

2. **Sincronização Periódica**
   - Produtos/Clientes: a cada **30 segundos**
   - Pedidos do site: a cada **5 segundos** (importação rápida)

3. **Sincronização na Inicialização**
   - Quando o PDV inicia, sincroniza todos os dados

### No Site (Next.js):

1. **API Routes com Cache Desabilitado**
   ```typescript
   // /app/api/products/route.ts
   export async function GET() {
     // Lê products-sync.json
     // Cache-Control: no-store
   }
   ```

2. **Hook useProducts com Auto-Refresh**
   ```typescript
   const { products, lastSync } = useProducts(true, 5000);
   // Atualiza a cada 5 segundos automaticamente
   ```

## 🚀 Como Usar no Site

### 1. Importar o Hook

```typescript
import { useProducts } from '@/app/hooks/useSyncData';

export default function Menu() {
  // Atualiza automaticamente a cada 5 segundos
  const { products, lastSync, loading, error } = useProducts(true, 5000);
  
  if (loading) return <div>Carregando...</div>;
  
  const pizzas = products.filter(p => p.category === 'pizzas' && p.isActive);
  const complements = products.filter(p => p.type === 'complement');
  
  return (
    <div>
      {pizzas.map(pizza => (
        <ProductCard key={pizza.id} product={pizza} />
      ))}
    </div>
  );
}
```

### 2. Componente Pronto (ProductsDisplay)

```typescript
import ProductsDisplay from '@/components/ProductsDisplay';

export default function MenuPage() {
  return <ProductsDisplay />;
}
```

## 📊 Monitoramento

### No PDV
O console mostra mensagens de sincronização:
```
✅ Produtos sincronizados com o site!
✅ Clientes sincronizados com o site!
✅ Pedidos sincronizados com o site!
🔄 Auto-sincronização ativada!
```

### No Site
O componente mostra status em tempo real:
```
✓ Sincronizado com PDV
Última atualização: 14:23:45
```

## 🔥 Vantagens

1. **Tempo Real**: Mudanças no PDV aparecem no site em até 5 segundos
2. **Sem Banco de Dados**: Usa arquivos JSON simples
3. **Bidirecional**: PDV → Site e Site → PDV
4. **Automático**: Não precisa intervenção manual
5. **Confiável**: Sincroniza mesmo se houver falhas temporárias
6. **Rápido**: Latência mínima entre sistemas

## ⚙️ Configurações

### Alterar Intervalo de Sincronização

**No PDV** (`electron.js`):
```javascript
// Pedidos do site (atualmente 5s)
setInterval(() => {
  importOrdersFromWebsite();
}, 5000); // Altere aqui

// Produtos/Clientes (atualmente 30s)
setInterval(() => {
  syncProductsToWebsite();
}, 30000); // Altere aqui
```

**No Site** (componente):
```typescript
// Atualiza a cada 5 segundos
const { products } = useProducts(true, 5000);
//                                      ↑ Altere aqui
```

## 🛠️ Troubleshooting

### Produtos não aparecem no site

1. Verificar se `public/products-sync.json` existe
2. Verificar console do PDV por erros
3. Testar API: `http://localhost:3000/api/products`

### Pedidos do site não chegam no PDV

1. Verificar se `public/orders-from-website.json` foi criado
2. Verificar console do PDV - deve importar a cada 5s
3. Verificar permissões de escrita na pasta `/public`

### Sincronização lenta

- Reduzir intervalo de atualização (cuidado com performance)
- Verificar se há muitos produtos (pode aumentar tempo de leitura)

## 📝 Próximas Melhorias

- [ ] WebSocket para sincronização instantânea
- [ ] Compressão dos arquivos JSON
- [ ] Cache inteligente no site
- [ ] Notificações push quando há mudanças
- [ ] Versionamento de dados
