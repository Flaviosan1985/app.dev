# Fluxo de Pagamento e Impressão Automática

## 📋 Visão Geral

Implementado sistema automático de finalização de vendas com:
- ✅ Seleção de forma de pagamento via modal
- ✅ Impressão automática de cupom em impressora térmica POS
- ✅ Fluxo otimizado para operação rápida

## 🔄 Fluxo de Operação

### 1. Preenchimento de Dados do Cliente

O operador preenche:
- Nome do cliente
- Telefone
- Tipo de entrega (Retirada ou Delivery)
- **Se Delivery**: Endereço completo, complemento e referência

### 2. Botão "OK - FINALIZAR"

Ao clicar em finalizar:
1. ✅ Sistema valida:
   - Carrinho não vazio
   - Nome e telefone preenchidos
   - Endereço preenchido (se delivery)

2. ✅ Abre modal de forma de pagamento

### 3. Modal de Forma de Pagamento

Modal exibe:
- **Total a Pagar** (destaque em verde)
- **4 opções de pagamento** (seleção com visual destacado):
  - 💵 Dinheiro
  - 💳 Cartão de Débito
  - 💳 Cartão de Crédito
  - 📱 PIX

Botões:
- ❌ **Cancelar**: Fecha modal e retorna ao carrinho
- ✅ **Confirmar e Imprimir**: Finaliza venda e imprime cupom

### 4. Impressão Automática

Após confirmar pagamento:
1. ✅ Cria/atualiza cliente no banco
2. ✅ Salva pedido no banco
3. ✅ **Envia cupom automaticamente para impressora POS**
4. ✅ Limpa carrinho e formulário
5. ✅ Exibe confirmação de sucesso

## 🖨️ Impressão Térmica

### Sistema de Detecção de Impressora

O sistema busca automaticamente por impressoras térmicas:
- Procura por nomes contendo: `pos`, `thermal`, `tm-`, `epson`
- Se não encontrar térmica, usa impressora padrão
- Notifica se nenhuma impressora estiver disponível

### Formato do Cupom

```
╔════════════════════════════╗
║   PIZZARIA ZATTERA         ║
║   Rua das Flores, 123      ║
║   Tel: (11) 1234-5678      ║
╠════════════════════════════╣
║ Pedido: #123456789         ║
║ Data: 09/12/2025 20:30     ║
║ Cliente: João Silva        ║
║ Telefone: (11) 98765-4321  ║
║ Tipo: DELIVERY             ║
║ Endereço: Rua ABC, 123     ║
╠════════════════════════════╣
║   ITENS DO PEDIDO          ║
║                            ║
║ 1x Coca-Cola 2L            ║
║                R$ 12.00    ║
║                            ║
║ 1x PIZZA MEIO A MEIO       ║
║   GRANDE                   ║
║   • Calabresa              ║
║   • Mussarela              ║
║                R$ 45.90    ║
╠════════════════════════════╣
║ TOTAL:          R$ 57.90   ║
║ Pagamento: Dinheiro        ║
╠════════════════════════════╣
║  Obrigado pela preferência!║
║      Volte sempre!         ║
╚════════════════════════════╝
```

### Conteúdo Detalhado do Cupom

**Cabeçalho:**
- Nome da pizzaria
- Endereço
- Telefone

**Dados do Pedido:**
- Número do pedido
- Data e hora
- Nome do cliente
- Telefone do cliente
- Tipo (Retirada/Delivery)
- Endereço de entrega (se delivery)
- Complemento e referência (se fornecidos)

**Itens:**
- **Produtos normais:**
  - Quantidade x Nome
  - Tamanho (se aplicável)
  - Observações
  - Valor total do item
  
- **Pizzas fracionadas:**
  - Quantidade x Tipo (INTEIRA/MEIO A MEIO/1/3)
  - Tamanho (GRANDE/BROTO)
  - Lista de sabores
  - Observações
  - Valor total do item

**Rodapé:**
- Total a pagar
- Forma de pagamento
- Mensagem de agradecimento

## 🛠️ Configuração Técnica

### Biblioteca Utilizada
- `electron-pos-printer` v1.3.3

### Configurações de Impressão

```javascript
{
  preview: false,           // Não mostra preview
  width: '80mm',           // Papel térmico 80mm
  margin: '0 0 0 0',       // Sem margens
  copies: 1,               // 1 cópia
  printerName: 'auto',     // Detecta automaticamente
  timeOutPerLine: 400,     // Velocidade de impressão
  silent: true             // Imprime sem diálogo
}
```

### Formatos Suportados

- HTML para formatação do cupom
- CSS inline para estilos
- Suporta caracteres UTF-8 (acentos, símbolos)

## 💾 Sincronização Automática

Após cada venda:
1. ✅ Dados salvos no banco local (mock data)
2. ✅ Cliente exportado para `customers-sync.json`
3. ✅ Pedido exportado para `orders-sync.json`
4. ✅ Arquivos disponíveis para sincronização com site

## 🔧 APIs Implementadas

### Frontend (PDV.tsx)
```typescript
// Estados
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
const [pendingOrder, setPendingOrder] = useState(null);

// Funções
prepareOrder()      // Valida e abre modal de pagamento
handleFinalizeSale() // Finaliza venda e imprime cupom
```

### Backend (electron.js)
```javascript
// Handler de impressão
ipcMain.handle('printer:print', async (event, orderData) => {
  // 1. Detecta impressora térmica
  // 2. Formata dados do cupom em HTML
  // 3. Envia para impressão
  // 4. Retorna sucesso/erro
});
```

### Preload (preload.js)
```javascript
printer: {
  print: (orderData) => ipcRenderer.invoke('printer:print', orderData)
}
```

## 📊 Benefícios

✅ **Operação rápida**: Modal de pagamento facilita seleção
✅ **Automação**: Impressão sem intervenção manual
✅ **Profissional**: Cupom formatado e organizado
✅ **Flexível**: Detecta qualquer impressora térmica
✅ **Confiável**: Notifica erros de impressão
✅ **Integrado**: Sincroniza automaticamente com site

## 🎯 Próximas Melhorias

- [ ] Configuração de impressora preferida
- [ ] Template customizável de cupom
- [ ] Reimpressão de cupons anteriores
- [ ] Impressão de relatórios
- [ ] Logo da pizzaria no cupom
- [ ] Código de barras no pedido
- [ ] Suporte a múltiplas impressoras

## 🚨 Tratamento de Erros

**Se impressora não disponível:**
- ⚠️ Pedido é salvo normalmente
- ⚠️ Exibe alerta informando erro
- ⚠️ Console registra detalhes do erro
- ✅ Operação continua sem perder dados

**Se erro na formatação:**
- ⚠️ Log de erro no console
- ⚠️ Retorna mensagem específica
- ✅ Dados do pedido preservados

## 📝 Exemplo de Uso

```typescript
// 1. Operador adiciona produtos ao carrinho
addToCart(product);
addPizzaToCart(pizzaItem);

// 2. Preenche dados do cliente
setCustomerName('João Silva');
setCustomerPhone('(11) 98765-4321');
setDeliveryType('delivery');
setDeliveryAddress('Rua ABC, 123');

// 3. Clica em "OK - FINALIZAR"
prepareOrder(); // Abre modal

// 4. Seleciona forma de pagamento
setPaymentMethod('Dinheiro');

// 5. Clica em "Confirmar e Imprimir"
handleFinalizeSale();
// -> Salva no banco
// -> Imprime cupom
// -> Limpa formulário
// -> Exibe confirmação
```

---

**Data de Implementação:** 09/12/2025  
**Versão:** 1.0.0  
**Status:** ✅ Operacional
