# Sistema de Complementos - Bordas de Pizza

## ✅ Implementado no PDV

### O que foi feito:

1. **Tipo de Produto**
   - Adicionado campo `type` na interface Product: `'product' | 'complement'`
   - Produtos normais: `type: 'product'`
   - Complementos: `type: 'complement'`

2. **Categoria Complementos**
   - Nova categoria "Complementos" criada com ícone `add_circle` e cor roxa (#8b5cf6)
   - Ordem 9 na lista de categorias

3. **Produtos de Borda Cadastrados**
   - **Borda Tradicional** - R$ 0,00 (sem custo adicional)
   - **Borda Recheada Catupiry** - R$ 8,00
   - **Borda Recheada Cheddar** - R$ 8,00

4. **Interface do PDV**
   - Campo "Tipo de Produto" no formulário (antes da categoria)
   - Badge roxa "Complemento" nos cards de produtos que são complementos
   - Contador separado mostrando quantidade de complementos
   - Botão especial "Novo Complemento" (roxo) ao lado de "Novo Produto"

5. **Sincronização com Site**
   - Campo `type` incluído no arquivo `products-sync.json`
   - Complementos são exportados junto com produtos normais
   - lastSync timestamp atualizado a cada mudança

## 📋 Próximos Passos (Site)

### O que precisa ser implementado no site Next.js:

1. **Ler arquivo products-sync.json**
   - Criar API route ou usar fetch client-side
   - Carregar produtos com `type: 'complement'`

2. **Interface de Seleção de Pizza**
   Quando o cliente clicar em uma pizza, mostrar:
   ```
   ┌─────────────────────────────────┐
   │  Pizza Margherita - R$ 45,90   │
   │                                 │
   │  Escolha o tamanho:             │
   │  ○ Grande - R$ 45,90            │
   │  ○ Broto - R$ 32,90             │
   │                                 │
   │  Escolha a borda:               │
   │  ○ Borda Tradicional (Grátis)  │
   │  ○ Catupiry (+R$ 8,00)         │
   │  ○ Cheddar (+R$ 8,00)          │
   │                                 │
   │  [Adicionar ao Carrinho]        │
   └─────────────────────────────────┘
   ```

3. **Lógica de Filtro**
   ```typescript
   // Buscar complementos (bordas)
   const complements = products.filter(p => p.type === 'complement' && p.category === 'complementos');
   
   // Buscar produtos normais
   const normalProducts = products.filter(p => p.type !== 'complement');
   ```

4. **Adicionar ao Carrinho**
   - Salvar pizza + tamanho escolhido + borda escolhida
   - Somar preço da pizza (grande ou broto) + preço da borda
   - Exemplo: Pizza Margherita Broto + Catupiry = R$ 32,90 + R$ 8,00 = R$ 40,90

5. **Exibição no Carrinho**
   ```
   Pizza Margherita (Broto)
   Borda: Catupiry
   R$ 40,90
   ```

## 🔄 Como Funciona o Fluxo Completo

### No PDV:
1. Admin/Operador cadastra produtos tipo "complemento" na categoria "Complementos"
2. Define preço (R$ 0,00 para tradicional, R$ 8,00 para recheadas)
3. Sistema sincroniza automaticamente para `products-sync.json`

### No Site:
1. Site lê `products-sync.json`
2. Separa produtos normais de complementos usando campo `type`
3. Quando cliente escolhe pizza, mostra opções de borda (complementos)
4. Cliente seleciona tamanho + borda
5. Sistema calcula total e adiciona ao carrinho
6. Pedido é criado com todos os detalhes

## 📝 Estrutura do products-sync.json

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
    },
    {
      "id": "22",
      "name": "Borda Tradicional",
      "price": 0.00,
      "category": "complementos",
      "type": "complement"
    },
    {
      "id": "23",
      "name": "Borda Recheada Catupiry",
      "price": 8.00,
      "category": "complementos",
      "type": "complement"
    }
  ],
  "lastSync": "2025-12-08T..."
}
```

## 🎨 Sugestão de Interface para o Site

### Modal de Personalização:
- Usar Radix UI ou Headless UI para acessibilidade
- Radio buttons para tamanhos (Grande/Broto)
- Radio buttons para bordas
- Mostrar preço total atualizado em tempo real
- Botão destacado "Adicionar ao Carrinho"

### Design:
- Cores consistentes com o PDV (vermelho para pizzas, roxo para complementos)
- Imagens dos produtos
- Ícones Material Icons para consistência visual
- Responsivo para mobile e desktop

## ✨ Vantagens do Sistema

1. **Flexível**: Admin pode adicionar novos complementos facilmente
2. **Sincronizado**: Mudanças no PDV refletem automaticamente no site
3. **Escalável**: Pode-se adicionar outros tipos de complementos (bebidas, sobremesas, etc)
4. **Organizado**: Separação clara entre produtos e complementos
5. **Profissional**: Interface intuitiva tanto para operadores quanto para clientes
