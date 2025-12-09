# 🧪 Checklist de Testes - Sistema de Sincronização

## ✅ Testes Obrigatórios

### 1️⃣ Teste de Invalidação de Cache (Produtos)

**Objetivo**: Verificar se mudanças em produtos são refletidas no PDV

#### Teste 1.1: Pausar Produto
- [ ] Abrir PDV em uma aba
- [ ] Abrir Admin em outra aba
- [ ] No Admin: Pausar um produto visível no PDV
- [ ] **Resultado Esperado**: Produto desaparece do PDV em 1-2 segundos
- [ ] **Console PDV**: `🔔 Cache invalidado detectado: products`
- [ ] **Console Admin**: `✅ Produto atualizado e cache invalidado`

#### Teste 1.2: Ativar Produto
- [ ] No Admin: Ativar um produto pausado
- [ ] **Resultado Esperado**: Produto aparece no PDV
- [ ] **Console PDV**: `🔄 PDV - Produtos recarregados: X ativos`

#### Teste 1.3: Editar Preço
- [ ] No Admin: Mudar preço de um produto
- [ ] **Resultado Esperado**: Preço atualizado no PDV
- [ ] **Verificar**: Produto exibe novo preço

#### Teste 1.4: Criar Produto
- [ ] No Admin: Criar novo produto ativo
- [ ] **Resultado Esperado**: Produto aparece no PDV
- [ ] **Console**: `✅ Produto criado e cache invalidado`

#### Teste 1.5: Deletar Produto
- [ ] No Admin: Deletar um produto
- [ ] **Resultado Esperado**: Produto removido do PDV
- [ ] **Console**: `✅ Produto deletado e cache invalidado`

---

### 2️⃣ Teste de Invalidação de Cache (Categorias)

**Objetivo**: Verificar sincronização de categorias

#### Teste 2.1: Pausar Categoria
- [ ] No Admin: Pausar uma categoria
- [ ] **Resultado Esperado**: Categoria atualizada no PDV
- [ ] **Console**: `🔔 Cache invalidado detectado: categories`

#### Teste 2.2: Editar Categoria
- [ ] No Admin: Mudar nome ou cor da categoria
- [ ] **Resultado Esperado**: Mudança visível no PDV

#### Teste 2.3: Criar Categoria
- [ ] No Admin: Criar nova categoria
- [ ] **Resultado Esperado**: Categoria aparece no sistema

---

### 3️⃣ Teste de Polling Periódico

**Objetivo**: Verificar sincronização automática a cada 5 minutos

#### Teste 3.1: Sincronização Periódica
- [ ] Abrir PDV e deixar aberto
- [ ] Aguardar 5 minutos
- [ ] **Resultado Esperado**: Console mostra `🔄 Verificação periódica de sincronização (5 min)...`
- [ ] Fazer mudança no Admin entre os intervalos
- [ ] **Resultado Esperado**: PDV sincroniza no próximo ciclo (máx 5 min)

---

### 4️⃣ Teste de Sincronização ao Focar Janela

**Objetivo**: Verificar reload ao voltar para o PDV

#### Teste 4.1: Foco na Janela
- [ ] Abrir PDV
- [ ] Minimizar ou trocar de aba
- [ ] No Admin: Fazer alteração em produto
- [ ] Voltar para a janela do PDV (clicar ou Alt+Tab)
- [ ] **Resultado Esperado**: Console mostra `👁️ Janela em foco - verificando atualizações...`
- [ ] **Resultado Esperado**: Mudança aparece imediatamente

---

### 5️⃣ Teste de Versionamento

**Objetivo**: Verificar sistema de versões

#### Teste 5.1: Verificar Versão
- [ ] Abrir Console do PDV (F12)
- [ ] Digite: `await window.electronAPI.data.getVersion()`
- [ ] **Resultado Esperado**: Retorna objeto com versões:
  ```json
  {
    "products": 1702156789456,
    "categories": 1702156789457,
    "lastUpdate": 1702156789457
  }
  ```

#### Teste 5.2: Comparação de Versões
- [ ] Anotar versão atual de produtos
- [ ] No Admin: Editar um produto
- [ ] Verificar nova versão no console
- [ ] **Resultado Esperado**: Versão mudou (número maior)

---

### 6️⃣ Teste de Reload Forçado

**Objetivo**: Verificar reload completo

#### Teste 6.1: Force Reload
- [ ] Abrir Console do PDV
- [ ] Digite: `await window.electronAPI.data.forceReload()`
- [ ] **Resultado Esperado**: Retorna objeto com produtos e categorias:
  ```json
  {
    "products": { "data": [...], "version": ..., "timestamp": ... },
    "categories": { "data": [...], "version": ..., "timestamp": ... }
  }
  ```

#### Teste 6.2: Reload ao Iniciar
- [ ] Fechar PDV completamente
- [ ] Abrir PDV novamente
- [ ] **Resultado Esperado**: Console mostra `✅ Dados carregados com sucesso`
- [ ] **Verificar**: Todos os produtos/categorias corretos

---

### 7️⃣ Teste de Filtro de Produtos Ativos

**Objetivo**: Garantir que apenas produtos ativos aparecem no PDV

#### Teste 7.1: Produtos Pausados Invisíveis
- [ ] Verificar lista de produtos no PDV
- [ ] Contar produtos visíveis
- [ ] No Admin: Verificar total de produtos (incluindo pausados)
- [ ] **Resultado Esperado**: PDV mostra apenas ativos
- [ ] **Console**: `🔄 PDV - Produtos: X ativos de Y totais`

---

### 8️⃣ Teste de Sincronização com Site

**Objetivo**: Verificar atualização do arquivo JSON

#### Teste 8.1: Arquivo products-sync.json
- [ ] No Admin: Editar produto
- [ ] Abrir: `/public/products-sync.json`
- [ ] **Verificar**: Campo `version` foi atualizado
- [ ] **Verificar**: Campo `cacheBreaker` é único
- [ ] **Verificar**: Produto editado está com novos dados

---

### 9️⃣ Teste de Performance

**Objetivo**: Garantir que sistema não afeta velocidade

#### Teste 9.1: Tempo de Resposta
- [ ] Abrir PDV
- [ ] Cronometrar tempo de carregamento
- [ ] **Resultado Esperado**: < 2 segundos
- [ ] Fazer várias mudanças rápidas no Admin
- [ ] **Resultado Esperado**: PDV permanece responsivo

#### Teste 9.2: Múltiplas Janelas
- [ ] Abrir 3 janelas do PDV simultaneamente
- [ ] No Admin: Pausar produto
- [ ] **Resultado Esperado**: Todas as 3 janelas sincronizam
- [ ] **Verificar**: Sem travamentos ou lentidão

---

### 🔟 Teste de Logs e Monitoramento

**Objetivo**: Validar sistema de logging

#### Teste 10.1: Logs Completos
Ao fazer uma mudança no Admin, verificar logs em ordem:

**Backend (Terminal Electron):**
```
✅ Produto atualizado e cache invalidado: Pizza Margherita - Ativo: false
🔄 Cache invalidado: products - versão: 1702156789456
✅ Produtos sincronizados com o site! Versão: 1702156789456
```

**Frontend PDV (Console):**
```
🔔 Cache invalidado detectado: products
🔄 PDV - Recarregando produtos...
🔄 PDV - Produtos recarregados: 19 ativos de 20 totais
```

**Frontend Admin (Console):**
```
✅ Produto atualizado e cache invalidado
```

---

## 🎯 Critérios de Aceitação

| Teste | Status | Critério |
|-------|--------|----------|
| Pausar produto | ⬜ | Desaparece em < 3 segundos |
| Ativar produto | ⬜ | Aparece em < 3 segundos |
| Editar preço | ⬜ | Atualiza em < 3 segundos |
| Polling 5min | ⬜ | Executa automaticamente |
| Foco janela | ⬜ | Sincroniza ao focar |
| Múltiplas janelas | ⬜ | Todas sincronizam |
| Performance | ⬜ | Sem lentidão perceptível |
| Logs | ⬜ | Todos aparecem corretamente |

---

## 🚨 Problemas Conhecidos e Soluções

### Problema: Sincronização lenta (> 5 segundos)
**Solução**: 
1. Verificar console por erros
2. Verificar conexão com backend
3. Reiniciar aplicação

### Problema: Logs não aparecem
**Solução**:
1. Abrir DevTools (F12)
2. Aba Console
3. Recarregar página (F5)

### Problema: Produto não desaparece após pausar
**Solução**:
1. Verificar se Admin salvou mudança
2. Aguardar 3 segundos
3. Clicar na janela do PDV (trigger foco)
4. Se persistir: F5 no PDV

---

## 📝 Registro de Testes

**Data**: _____________  
**Testador**: _____________  
**Versão**: 2.0.0

**Resultados**:
- [ ] Todos os testes passaram
- [ ] Alguns testes falharam (especificar): _____________
- [ ] Sistema aprovado para produção

**Observações**:
_______________________________________________
_______________________________________________
_______________________________________________

---

**Status**: 🧪 Aguardando Testes  
**Prioridade**: 🔴 CRÍTICA
