/**
 * ═══════════════════════════════════════════════════════════════
 * 🖨️ SERVIÇO DE IMPRESSÃO ESC/POS - PIZZARIA ZATTERA
 * ═══════════════════════════════════════════════════════════════
 * 
 * Serviço responsável por comunicação com impressora térmica POS
 * Suporta impressoras via USB, Serial e Rede (IP)
 * 
 * Tecnologias:
 * - ESC/POS Protocol (comandos padrão de impressão térmica)
 * - LocalStorage para persistência de configurações
 * - Servidor Node.js local para comunicação com impressora
 * 
 * @author Pizzaria Zattera
 * @version 1.0.0
 */

// import { Order } from '../types'; // Usando 'any' para compatibilidade

// ═══════════════════════════════════════════════════════════════
// 📋 INTERFACES E TIPOS
// ═══════════════════════════════════════════════════════════════

export interface PrinterConfig {
  enabled: boolean;
  printerType: 'usb' | 'network' | 'serial';
  printerIP?: string;
  printerPort?: number;
  characterSet: 'CP860' | 'CP850' | 'CP437';
  paperWidth: 58 | 80; // mm
  autoPrint: boolean;
  printCopies: number;
  serverUrl: string; // URL do servidor Node.js local
}

export interface PrintJob {
  orderId: string;
  timestamp: Date;
  status: 'pending' | 'printing' | 'success' | 'error';
  errorMessage?: string;
}

// ═══════════════════════════════════════════════════════════════
// 🔧 CONFIGURAÇÕES PADRÃO
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: PrinterConfig = {
  enabled: false,
  printerType: 'usb',
  characterSet: 'CP860',
  paperWidth: 80,
  autoPrint: false,
  printCopies: 1,
  serverUrl: 'http://localhost:3030'
};

const STORAGE_KEY = 'zattera_printer_config';

// ═══════════════════════════════════════════════════════════════
// 💾 PERSISTÊNCIA DE CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════

export function loadPrinterConfig(): PrinterConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Erro ao carregar configurações da impressora:', error);
  }
  return DEFAULT_CONFIG;
}

export function savePrinterConfig(config: PrinterConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Erro ao salvar configurações da impressora:', error);
  }
}

// ═══════════════════════════════════════════════════════════════
// 🌐 COMUNICAÇÃO COM SERVIDOR DE IMPRESSÃO
// ═══════════════════════════════════════════════════════════════

/**
 * Verifica se o servidor de impressão está ativo
 */
export async function checkPrintServer(serverUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.error('Servidor de impressão offline:', error);
    return false;
  }
}

/**
 * Lista impressoras disponíveis no sistema
 */
export async function listAvailablePrinters(serverUrl: string): Promise<string[]> {
  try {
    const response = await fetch(`${serverUrl}/printers`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) throw new Error('Erro ao listar impressoras');
    
    const data = await response.json();
    return data.printers || [];
  } catch (error) {
    console.error('Erro ao listar impressoras:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 📄 FORMATAÇÃO DE CUPOM FISCAL
// ═══════════════════════════════════════════════════════════════

/**
 * Formata linha centralizada
 */
function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

/**
 * Formata linha com texto à esquerda e direita
 */
function formatLine(left: string, right: string, width: number): string {
  const spacing = Math.max(1, width - left.length - right.length);
  return left + ' '.repeat(spacing) + right;
}

/**
 * Gera linha de separação
 */
function separator(width: number, char: string = '-'): string {
  return char.repeat(width);
}

/**
 * Formata data/hora para impressão
 */
function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Gera conteúdo do cupom fiscal formatado
 */
export function generateReceipt(order: any, config: PrinterConfig): string {
  const width = config.paperWidth === 80 ? 48 : 32;
  let receipt = '';

  // ═══════════════════════════════════════════════════════════════
  // CABEÇALHO
  // ═══════════════════════════════════════════════════════════════
  
  receipt += '\n';
  receipt += centerText('PIZZARIA ZATTERA', width) + '\n';
  receipt += centerText('Santos, SP', width) + '\n';
  receipt += centerText('Tel: (13) 99651-1793', width) + '\n';
  receipt += separator(width, '=') + '\n';
  receipt += '\n';

  // ═══════════════════════════════════════════════════════════════
  // INFORMAÇÕES DO PEDIDO
  // ═══════════════════════════════════════════════════════════════
  
  receipt += `Pedido: #${order.id.slice(-6).toUpperCase()}\n`;
  receipt += `Data: ${formatDateTime(new Date(order.createdAt))}\n`;
  receipt += `Operador: ${order.userName || 'Sistema'}\n`;
  receipt += separator(width) + '\n';
  
  // Tipo de pedido
  if (order.deliveryType === 'delivery') {
    receipt += 'TIPO: ENTREGA\n';
  } else {
    receipt += 'TIPO: RETIRADA\n';
  }
  receipt += separator(width) + '\n';

  // ═══════════════════════════════════════════════════════════════
  // DADOS DO CLIENTE
  // ═══════════════════════════════════════════════════════════════
  
  receipt += '\n';
  receipt += 'CLIENTE:\n';
  receipt += `Nome: ${order.customerName}\n`;
  receipt += `Tel: ${order.customerPhone}\n`;
  
  if (order.deliveryType === 'delivery' && order.deliveryAddress) {
    receipt += '\nENDERECO DE ENTREGA:\n';
    receipt += `${order.deliveryAddress}\n`;
    if (order.addressComplement) {
      receipt += `Compl: ${order.addressComplement}\n`;
    }
    if (order.addressReference) {
      receipt += `Ref: ${order.addressReference}\n`;
    }
    if (order.neighborhood) {
      receipt += `Bairro: ${order.neighborhood}\n`;
    }
  }
  
  receipt += separator(width) + '\n';

  // ═══════════════════════════════════════════════════════════════
  // ITENS DO PEDIDO
  // ═══════════════════════════════════════════════════════════════
  
  receipt += '\n';
  receipt += 'ITENS DO PEDIDO:\n';
  receipt += separator(width) + '\n';

  order.items.forEach((item: any, index: number) => {
    // Nome do produto
    receipt += `${index + 1}. ${item.product.name}\n`;
    
    // Tamanho (se houver)
    if (item.size) {
      receipt += `   Tamanho: ${item.size === 'grande' ? 'Grande' : 'Broto'}\n`;
    }
    
    // Complementos (se houver)
    if (item.complements && item.complements.length > 0) {
      item.complements.forEach((comp: any) => {
        const compPrice = comp.price > 0 ? ` (+R$ ${comp.price.toFixed(2)})` : '';
        receipt += `   + ${comp.name}${compPrice}\n`;
      });
    }
    
    // Observação (se houver)
    if (item.observation) {
      receipt += `   OBS: ${item.observation}\n`;
    }
    
    // Preço unitário e subtotal
    const unitPrice = item.product.price + (item.complements || []).reduce((sum: number, c: any) => sum + c.price, 0);
    const subtotal = unitPrice * item.quantity;
    
    receipt += formatLine(
      `   ${item.quantity}x R$ ${unitPrice.toFixed(2)}`,
      `R$ ${subtotal.toFixed(2)}`,
      width
    ) + '\n';
    receipt += '\n';
  });

  // Pizzas fracionadas (se houver)
  if (order.pizzas && order.pizzas.length > 0) {
    order.pizzas.forEach((pizza: any, index: number) => {
      receipt += `${order.items.length + index + 1}. Pizza `;
      
      if (pizza.type === 'inteira') {
        receipt += 'Inteira';
      } else if (pizza.type === 'meio-a-meio') {
        receipt += '1/2 a 1/2';
      } else {
        receipt += '3 Sabores';
      }
      
      receipt += ` (${pizza.size === 'grande' ? 'Grande' : 'Broto'})\n`;
      
      // Sabores
      pizza.flavors.forEach((flavor: any) => {
        receipt += `   - ${flavor.product.name}\n`;
      });
      
      // Complementos (se houver)
      if (pizza.complements && pizza.complements.length > 0) {
        pizza.complements.forEach((comp: any) => {
          const compPrice = comp.price > 0 ? ` (+R$ ${comp.price.toFixed(2)})` : '';
          receipt += `   + ${comp.name}${compPrice}\n`;
        });
      }
      
      // Observação (se houver)
      if (pizza.observation) {
        receipt += `   OBS: ${pizza.observation}\n`;
      }
      
      // Preço
      const pizzaTotal = (pizza.price + (pizza.complements || []).reduce((sum: number, c: any) => sum + c.price, 0)) * pizza.quantity;
      receipt += formatLine(
        `   ${pizza.quantity}x R$ ${pizza.price.toFixed(2)}`,
        `R$ ${pizzaTotal.toFixed(2)}`,
        width
      ) + '\n';
      receipt += '\n';
    });
  }

  receipt += separator(width) + '\n';

  // ═══════════════════════════════════════════════════════════════
  // TOTAIS
  // ═══════════════════════════════════════════════════════════════
  
  receipt += '\n';
  receipt += formatLine('Subtotal:', `R$ ${order.subtotal.toFixed(2)}`, width) + '\n';
  
  if (order.discount && order.discount > 0) {
    receipt += formatLine('Desconto:', `-R$ ${order.discount.toFixed(2)}`, width) + '\n';
  }
  
  if (order.serviceCharge && order.serviceCharge > 0) {
    receipt += formatLine('Taxa Servico:', `+R$ ${order.serviceCharge.toFixed(2)}`, width) + '\n';
  }
  
  if (order.deliveryFee && order.deliveryFee > 0) {
    receipt += formatLine('Taxa Entrega:', `+R$ ${order.deliveryFee.toFixed(2)}`, width) + '\n';
  }
  
  receipt += separator(width, '=') + '\n';
  receipt += formatLine('TOTAL:', `R$ ${order.total.toFixed(2)}`, width) + '\n';
  receipt += separator(width, '=') + '\n';

  // ═══════════════════════════════════════════════════════════════
  // FORMA DE PAGAMENTO
  // ═══════════════════════════════════════════════════════════════
  
  receipt += '\n';
  receipt += `Pagamento: ${order.paymentMethod}\n`;
  
  if (order.paymentMethod === 'Dinheiro' && order.cashAmount && order.cashAmount > 0) {
    receipt += formatLine('Valor Recebido:', `R$ ${order.cashAmount.toFixed(2)}`, width) + '\n';
    const change = order.cashAmount - order.total;
    if (change > 0) {
      receipt += formatLine('Troco:', `R$ ${change.toFixed(2)}`, width) + '\n';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // OBSERVAÇÕES DO PEDIDO
  // ═══════════════════════════════════════════════════════════════
  
  if (order.observation) {
    receipt += '\n';
    receipt += separator(width) + '\n';
    receipt += 'OBSERVACOES:\n';
    receipt += `${order.observation}\n`;
  }

  // ═══════════════════════════════════════════════════════════════
  // RODAPÉ
  // ═══════════════════════════════════════════════════════════════
  
  receipt += '\n';
  receipt += separator(width, '=') + '\n';
  receipt += centerText('Obrigado pela preferencia!', width) + '\n';
  receipt += centerText('Volte sempre!', width) + '\n';
  receipt += separator(width, '=') + '\n';
  receipt += '\n';
  receipt += centerText(`Status: ${order.status}`, width) + '\n';
  receipt += '\n\n\n';

  return receipt;
}

// ═══════════════════════════════════════════════════════════════
// 🖨️ FUNÇÕES DE IMPRESSÃO
// ═══════════════════════════════════════════════════════════════

/**
 * Imprime cupom fiscal
 */
export async function printReceipt(order: any, config: PrinterConfig): Promise<void> {
  const isOnline = await checkPrintServer(config.serverUrl);
  
  if (!isOnline) {
    throw new Error('Servidor de impressão offline. Inicie o servidor com: npm run print-server');
  }

  const receipt = generateReceipt(order, config);
  
  try {
    const response = await fetch(`${config.serverUrl}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: receipt,
        copies: config.printCopies,
        printerType: config.printerType,
        printerIP: config.printerIP,
        printerPort: config.printerPort,
        characterSet: config.characterSet,
        paperWidth: config.paperWidth
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao imprimir');
    }

    console.log('✅ Cupom impresso com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao imprimir:', error);
    throw error;
  }
}

/**
 * Imprime cupom de teste
 */
export async function printTestReceipt(config: PrinterConfig): Promise<void> {
  const isOnline = await checkPrintServer(config.serverUrl);
  
  if (!isOnline) {
    throw new Error('Servidor de impressão offline');
  }

  const width = config.paperWidth === 80 ? 48 : 32;
  let receipt = '\n';
  receipt += centerText('TESTE DE IMPRESSAO', width) + '\n';
  receipt += separator(width, '=') + '\n';
  receipt += centerText('PIZZARIA ZATTERA', width) + '\n';
  receipt += separator(width) + '\n';
  receipt += `Hora: ${formatDateTime(new Date())}\n`;
  receipt += `Largura: ${config.paperWidth}mm\n`;
  receipt += `Charset: ${config.characterSet}\n`;
  receipt += separator(width, '=') + '\n';
  receipt += '\n\n\n';

  try {
    const response = await fetch(`${config.serverUrl}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: receipt,
        copies: 1,
        printerType: config.printerType,
        printerIP: config.printerIP,
        printerPort: config.printerPort,
        characterSet: config.characterSet,
        paperWidth: config.paperWidth
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao imprimir teste');
    }

    console.log('✅ Teste de impressão concluído!');
  } catch (error) {
    console.error('❌ Erro no teste de impressão:', error);
    throw error;
  }
}
