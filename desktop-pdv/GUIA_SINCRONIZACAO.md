# ⚡ Guia Rápido - Sincronização Automática

## 🎯 Como Usar

### Para Administradores

**Editar/Pausar Produtos:**
1. Acesse Admin → Produtos
2. Edite ou pause/ative o produto
3. ✅ **Automático**: PDV atualiza em 1-2 segundos

**Editar Categorias:**
1. Acesse Admin → Categorias
2. Edite ou pause/ative a categoria
3. ✅ **Automático**: Sincronização instantânea

### Para Operadores (PDV)

**Nada a fazer!** 🎉
- Produtos e categorias atualizam **automaticamente**
- Mudanças do Admin aparecem em tempo real
- Sistema verifica atualizações a cada 5 minutos
- Ao focar a janela do PDV, verifica atualizações

## 🔍 Como Verificar se Está Funcionando

### 1. Console do Navegador (F12)

**Logs esperados ao abrir o PDV:**
```
✅ Dados carregados - Produtos: 20 Categorias: 9
🔄 PDV - Produtos recarregados: 19 ativos
```

**Logs após Admin fazer alteração:**
```
🔔 Cache invalidado detectado: products
📦 Produtos recarregados
```

**Logs a cada 5 minutos:**
```
🔄 Verificação periódica de sincronização (5 min)...
```

### 2. Teste Prático

**Cenário 1: Pausar Produto**
- ✅ Admin pausa "Pizza Margherita"
- ✅ PDV: Pizza some da lista em ~1 segundo
- ✅ Console: `🔔 Cache invalidado detectado`

**Cenário 2: Ativar Produto**
- ✅ Admin ativa "Pizza Portuguesa"
- ✅ PDV: Pizza aparece na lista
- ✅ Console: `📦 Produtos recarregados`

**Cenário 3: Editar Preço**
- ✅ Admin muda preço de R$ 45,90 → R$ 49,90
- ✅ PDV: Preço atualizado automaticamente
- ✅ Console: `✅ Produto atualizado`

## 🚨 Troubleshooting

### Produto não aparece no PDV?
1. Verifique se `isActive: true`
2. Verifique console: deve ter log de reload
3. Pressione F5 no PDV para forçar reload

### Mudanças não aparecem?
1. Aguarde 1-2 segundos (tempo de propagação)
2. Verifique console: procure por erros
3. Verifique se Admin salvou as mudanças
4. Clique na janela do PDV (trigger de sincronização)

### Console sem logs?
1. Pressione F12 para abrir DevTools
2. Vá na aba Console
3. Recarregue a página (F5)
4. Deve aparecer logs de carregamento

## 📊 Indicadores de Sincronização

| Indicador | Significado |
|-----------|-------------|
| 🔔 Cache invalidado | Admin fez alteração, sincronizando... |
| ✅ Produtos carregados | Dados atualizados com sucesso |
| 🔄 Verificação periódica | Polling automático (5 min) |
| 👁️ Janela em foco | Sincronização ao voltar pro PDV |
| 📦 Produtos desatualizados | Versão antiga detectada, atualizando |
| ❌ Erro | Problema na sincronização (verificar conexão) |

## ⚙️ Configurações

### Intervalo de Polling
**Padrão**: 5 minutos  
**Localização**: `App.tsx` linha ~85  
**Alterar**:
```typescript
5 * 60 * 1000  // 5 minutos
// Mudar para:
2 * 60 * 1000  // 2 minutos
```

### Desabilitar Polling (não recomendado)
```typescript
// Comentar estas linhas em App.tsx:
// const syncInterval = setInterval(...);
```

## 💡 Dicas

- 📱 **Múltiplas Janelas**: Todas sincronizam simultaneamente
- ⚡ **Performance**: Sistema é eficiente, não afeta velocidade
- 🔒 **Confiável**: 3 mecanismos garantem sincronização
- 📊 **Monitorável**: Use console para acompanhar em tempo real

## 🎯 Quando NÃO Sincroniza

- ❌ Mudanças em pedidos (não afeta catálogo)
- ❌ Mudanças em clientes (dados isolados)
- ❌ Configurações de loja (requer reload manual)

## 📝 Recursos Sincronizados

| Recurso | Sincronização |
|---------|---------------|
| ✅ Produtos (criar/editar/pausar/deletar) | **Automática** |
| ✅ Categorias (criar/editar/pausar/deletar) | **Automática** |
| ✅ Status ativo/pausado | **Automática** |
| ✅ Preços e descrições | **Automática** |
| ⏸️ Pedidos | Manual (não necessário) |
| ⏸️ Clientes | Manual (não necessário) |
| ⏸️ Configurações | Manual (requer reload) |

---

**Versão**: 2.0.0  
**Status**: ✅ Ativo e Funcionando
