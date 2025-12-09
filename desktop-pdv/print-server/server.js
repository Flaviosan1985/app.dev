/**
 * ═══════════════════════════════════════════════════════════════
 * 🖨️ SERVIDOR DE IMPRESSÃO ESC/POS - PIZZARIA ZATTERA
 * 
 * ⚠️ ATENÇÃO: Este arquivo foi modificado para incluir o servidor
 * de automação de pedidos e WhatsApp.
 * ═══════════════════════════════════════════════════════════════
 * 
 * Servidor Node.js local para comunicação com impressoras térmicas
 * Suporta conexões USB, Serial e Rede (IP)
 * 
 * Porta padrão: 3030
 * 
 * Instalação:
 * npm install
 * 
 * Execução:
 * npm start
 * 
 * @author Pizzaria Zattera
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const { createServer } = require('http'); // Adicionado para Socket.IO
const { Server } = require('socket.io'); // Adicionado para Socket.IO
const { processNewOrder, updateOrderStatus } = require('./order'); // Importa as funções de pedidos
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const app = express();
const PORT = process.env.PORT || 3030;

// ═══════════════════════════════════════════════════════════════
// 🔧 MIDDLEWARES
// ═══════════════════════════════════════════════════════════════

app.use(cors());
app.use(express.json());

// Configuração do Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Em produção, restrinja para o domínio do seu site
    methods: ["GET", "POST"]
  }
});


// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ═══════════════════════════════════════════════════════════════
// 📍 ROTAS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /health
 * Verifica se o servidor está ativo
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Pizzaria Zattera Print Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /printers
 * Lista impressoras disponíveis no sistema
 */
app.get('/printers', async (req, res) => {
  try {
    // No Windows, lista portas USB e COM
    // No Linux, lista /dev/usb/lp* e /dev/ttyUSB*
    const os = require('os');
    const platform = os.platform();
    
    let printers = [];

    if (platform === 'win32') {
      // Windows: lista portas COM e USB
      printers = [
        'USB001',
        'USB002',
        'COM1',
        'COM2',
        'COM3',
        'COM4'
      ];
    } else if (platform === 'linux') {
      // Linux: lista dispositivos USB
      const fs = require('fs');
      try {
        const usbDevices = fs.readdirSync('/dev/usb/');
        printers = usbDevices.map(dev => `/dev/usb/${dev}`);
      } catch (error) {
        printers = ['/dev/usb/lp0', '/dev/usb/lp1'];
      }
    } else if (platform === 'darwin') {
      // macOS: lista portas USB
      printers = [
        '/dev/cu.usbserial',
        '/dev/tty.usbserial'
      ];
    }

    res.json({
      success: true,
      platform,
      printers
    });
  } catch (error) {
    console.error('❌ Erro ao listar impressoras:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar impressoras',
      error: error.message
    });
  }
});

/**
 * POST /print
 * Imprime conteúdo na impressora térmica
 * 
 * Body:
 * {
 *   content: string,
 *   copies?: number,
 *   printerType: 'usb' | 'network' | 'serial',
 *   printerIP?: string,
 *   printerPort?: number,
 *   characterSet?: string,
 *   paperWidth?: 58 | 80
 * }
 */
app.post('/print', async (req, res) => {
  try {
    const {
      content,
      copies = 1,
      printerType = 'usb',
      printerIP,
      printerPort = 9100,
      characterSet = 'CP860',
      paperWidth = 80
    } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Conteúdo não fornecido'
      });
    }

    console.log('📄 Iniciando impressão...');
    console.log('Tipo:', printerType);
    console.log('Cópias:', copies);
    console.log('Largura:', paperWidth + 'mm');

    // ═══════════════════════════════════════════════════════════════
    // CONFIGURAR IMPRESSORA
    // ═══════════════════════════════════════════════════════════════

    let printerConfig = {
      type: PrinterTypes.EPSON,
      width: paperWidth === 58 ? 32 : 48,
      characterSet: CharacterSet.PC860_PORTUGUESE
    };

    // Configurar tipo de conexão
    if (printerType === 'network' && printerIP) {
      printerConfig.interface = `tcp://${printerIP}:${printerPort}`;
      console.log(`🌐 Conectando em: ${printerIP}:${printerPort}`);
    } else if (printerType === 'serial') {
      printerConfig.interface = 'COM3'; // Ajustar conforme necessário
      console.log(`🔌 Conectando em: COM3`);
    } else {
      // USB
      printerConfig.interface = '/dev/usb/lp0'; // Linux
      // Para Windows, usar: printer:USB001
      // Para macOS, usar: /dev/cu.usbserial
      console.log(`🔌 Conectando via USB`);
    }

    // Ajustar charset
    if (characterSet === 'CP850') {
      printerConfig.characterSet = CharacterSet.PC850_MULTILINGUAL;
    } else if (characterSet === 'CP437') {
      printerConfig.characterSet = CharacterSet.PC437_USA;
    }

    // ═══════════════════════════════════════════════════════════════
    // IMPRIMIR
    // ═══════════════════════════════════════════════════════════════

    for (let i = 0; i < copies; i++) {
      const printer = new ThermalPrinter(printerConfig);

      // Verificar se impressora está conectada
      const isConnected = await printer.isPrinterConnected();
      
      if (!isConnected) {
        console.warn('⚠️ Impressora não conectada, simulando impressão...');
        console.log('═══════════════ SIMULAÇÃO ═══════════════');
        console.log(content);
        console.log('═══════════════════════════════════════════');
        
        // Em modo de desenvolvimento, simula sucesso
        if (process.env.NODE_ENV === 'development') {
          continue;
        } else {
          throw new Error('Impressora não conectada');
        }
      }

      // Imprimir conteúdo
      printer.println(content);
      
      // Cortar papel
      printer.cut();

      // Executar impressão
      await printer.execute();
      
      console.log(`✅ Cópia ${i + 1}/${copies} impressa`);
    }

    res.json({
      success: true,
      message: `${copies} ${copies === 1 ? 'cópia impressa' : 'cópias impressas'} com sucesso`,
      copies
    });

  } catch (error) {
    console.error('❌ Erro ao imprimir:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao imprimir',
      error: error.message
    });
  }
});

/**
 * POST /test
 * Imprime um cupom de teste
 */
app.post('/test', async (req, res) => {
  try {
    const testContent = `

        *** TESTE DE IMPRESSAO ***
        ===========================
        
        PIZZARIA ZATTERA
        Santos, SP
        
        Data: ${new Date().toLocaleString('pt-BR')}
        
        ===========================
        
        Se voce esta lendo isto,
        sua impressora esta funcionando!
        
        ===========================
        
        


`;

    req.body = {
      content: testContent,
      copies: 1,
      ...req.body
    };

    return app._router.handle({ ...req, method: 'POST', url: '/print' }, res);
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no teste de impressão',
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 📦 ROTAS DE AUTOMAÇÃO DE PEDIDOS (SITE <-> PDV)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /pedidos
 * Recebe um novo pedido do site, registra e notifica o PDV.
 */
app.post('/pedidos', (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData || !orderData.id) {
      return res.status(400).json({ error: 'Dados do pedido inválidos.' });
    }
    
    // Processa o pedido usando a lógica que criamos
    const createdOrder = processNewOrder(io, orderData);
    
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('[ERRO NO ENDPOINT /pedidos]', error);
    res.status(500).json({ error: 'Erro interno ao processar o pedido.' });
  }
});

/**
 * POST /pedidos/:id/despachar
 * Atualiza o status de um pedido (ex: 'Pedido Pronto') e notifica o cliente.
 */
app.post('/pedidos/:id/despachar', (req, res) => {
  const { id } = req.params;
  const updatedOrder = updateOrderStatus(io, id, 'Pedido Pronto'); // Chama a função implementada

  if (!updatedOrder) {
    return res.status(404).json({ error: `Pedido ${id} não encontrado.` });
  }
  res.status(200).json({ message: `Pedido ${id} despachado com sucesso.`, order: updatedOrder });
});

// ═══════════════════════════════════════════════════════════════
// 🚀 INICIAR SERVIDOR
// ═══════════════════════════════════════════════════════════════

httpServer.listen(PORT, () => {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SERVIDOR INTEGRADO - PIZZARIA ZATTERA');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  ✅ Servidor rodando em: http://localhost:${PORT}`);
  console.log('  ✅ WebSocket para automação de pedidos: ATIVO');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n  Aguardando requisições...\n');
});

// ═══════════════════════════════════════════════════════════════
// ⚠️ TRATAMENTO DE ERROS
// ═══════════════════════════════════════════════════════════════

process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Encerrando servidor de impressão...');
  process.exit(0);
});
