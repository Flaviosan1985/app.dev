const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { PosPrinter } = require('electron-pos-printer');
const PDVDatabase = require('./src/database/sqlite');

let mainWindow;
let syncWatcher = null;
let syncTimer = null;
let database;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'build/icon.png'),
    title: 'Pizzaria Zattera PDV',
    backgroundColor: '#1f2937',
    frame: true,
    autoHideMenuBar: false,
    resizable: true,
    center: true
  });

  // Sempre carregar do Vite em dev - verificar qual porta está em uso
  const vitePort = process.env.VITE_PORT || '3001';
  mainWindow.loadURL(`http://localhost:${vitePort}`);
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Inicializar banco de dados
app.whenReady().then(() => {
    // Inicializar database
  database = new PDVDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // if (database) {
    //   database.close();
    // }
    app.quit();
  }
});

// ===== IPC HANDLERS =====
// DADOS MOCK TEMPORÁRIOS (remover quando SQLite funcionar)
const mockProducts = [
  // Pizzas Grande
  { id: '1', name: 'Pizza Margherita', description: 'Molho, mussarela e manjericão', price: 45.90, priceSmall: 32.90, category: 'pizzas', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', isActive: true, isFeatured: true, stock: 999, preparationTime: 30 },
  { id: '2', name: 'Pizza Calabresa', description: 'Molho, mussarela e calabresa', price: 48.90, priceSmall: 35.90, category: 'pizzas', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 30 },
  { id: '3', name: 'Pizza Portuguesa', description: 'Molho, mussarela, presunto, ovos e cebola', price: 52.90, priceSmall: 38.90, category: 'pizzas', image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 35 },
  { id: '4', name: 'Pizza 4 Queijos', description: 'Mussarela, provolone, gorgonzola e parmesão', price: 54.90, priceSmall: 40.90, category: 'pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 30 },
  
  // Refeições
  { id: '5', name: 'X-Burguer', description: 'Hambúrguer, queijo, alface e tomate', price: 18.90, category: 'refeicoes', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 15 },
  { id: '6', name: 'X-Egg', description: 'Hambúrguer, queijo, ovo, alface e tomate', price: 21.90, category: 'refeicoes', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 15 },
  { id: '7', name: 'Batata Frita', description: 'Porção grande de batatas fritas crocantes', price: 15.90, category: 'refeicoes', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 10 },
  { id: '8', name: 'Pão de Alho', description: 'Pão francês com alho e manteiga', price: 12.90, category: 'refeicoes', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 10 },
  
  // Bebidas
  { id: '9', name: 'Coca-Cola 2L', description: 'Refrigerante Coca-Cola 2 litros', price: 12.00, category: 'bebidas', image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 0 },
  { id: '10', name: 'Guaraná 2L', description: 'Refrigerante Guaraná 2 litros', price: 10.00, category: 'bebidas', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 0 },
  { id: '11', name: 'Água Mineral', description: 'Água mineral sem gás 500ml', price: 3.00, category: 'bebidas', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 0 },
  { id: '12', name: 'Cerveja Lata', description: 'Cerveja pilsen gelada 350ml', price: 6.00, category: 'bebidas', image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 0 },
  
  // Sucos
  { id: '13', name: 'Suco Natural Laranja', description: 'Suco de laranja natural 500ml', price: 8.00, category: 'sucos', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 5 },
  { id: '14', name: 'Suco Natural Limão', description: 'Suco de limão natural 500ml', price: 7.00, category: 'sucos', image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f0e?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 5 },
  { id: '15', name: 'Suco Natural Morango', description: 'Suco de morango natural 500ml', price: 9.00, category: 'sucos', image: 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 5 },
  
  // Massas
  { id: '16', name: 'Espaguete Bolonhesa', description: 'Massa com molho bolonhesa', price: 32.90, category: 'massas', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 25 },
  { id: '17', name: 'Lasanha', description: 'Lasanha à bolonhesa gratinada', price: 35.90, category: 'massas', image: 'https://images.unsplash.com/photo-1619895092538-128341789043?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 30 },
  
  // Açaí
  { id: '18', name: 'Açaí 300ml', description: 'Açaí tradicional', price: 15.00, category: 'acai', image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 5 },
  { id: '19', name: 'Açaí 500ml', description: 'Açaí tradicional tamanho médio', price: 22.00, category: 'acai', image: 'https://images.unsplash.com/photo-1562508037-7b9e00c33611?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 5 },
  
  // Porções
  { id: '20', name: 'Porção Frango', description: 'Porção de frango à passarinho', price: 38.90, category: 'porcoes', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 20 },
  { id: '21', name: 'Porção Calabresa', description: 'Porção de calabresa acebolada', price: 42.90, category: 'porcoes', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 20 },
  
  // Complementos (Bordas)
  { id: '22', name: 'Borda Tradicional', description: 'Borda tradicional sem recheio', price: 0.00, category: 'complementos', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 0, type: 'complement' },
  { id: '23', name: 'Borda Recheada Catupiry', description: 'Borda recheada com catupiry', price: 8.00, category: 'complementos', image: 'https://images.unsplash.com/photo-1574126154517-d1e0d89ef734?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 5, type: 'complement' },
  { id: '24', name: 'Borda Recheada Cheddar', description: 'Borda recheada com cheddar', price: 8.00, category: 'complementos', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', isActive: true, isFeatured: false, stock: 999, preparationTime: 5, type: 'complement' },
];

// Função para sincronizar produtos com o site
function syncProductsToWebsite(products = mockProducts) {
  try {
    const websitePath = path.join(__dirname, '../public/products-sync.json');
    const syncData = {
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        priceSmall: p.priceSmall,
        category: p.category,
        image: p.image,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        type: p.type || 'product'
      })),
      lastSync: new Date().toISOString(),
      version: Date.now(), // Timestamp para evitar cache HTTP
      cacheBreaker: Math.random().toString(36).substring(7) // Cache buster adicional
    };
    fs.writeFileSync(websitePath, JSON.stringify(syncData, null, 2));
    console.log('✅ Produtos sincronizados com o site! Versão:', syncData.version);
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar produtos:', error);
    return false;
  }
}

// Função para sincronizar clientes com o site
function syncCustomersToWebsite() {
  try {
    const websitePath = path.join(__dirname, '../public/customers-sync.json');
    const syncData = {
      customers: mockCustomers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        addressDetails: c.addressDetails,
        orderHistory: c.orderHistory,
        totalSpent: c.totalSpent,
        lastOrderDate: c.lastOrderDate
      })),
      lastSync: new Date().toISOString()
    };
    fs.writeFileSync(websitePath, JSON.stringify(syncData, null, 2));
    console.log('✅ Clientes sincronizados com o site!');
  } catch (error) {
    console.error('❌ Erro ao sincronizar clientes:', error);
  }
}

// Função para sincronizar pedidos com o site
function syncOrdersToWebsite() {
  try {
    const websitePath = path.join(__dirname, '../public/orders-sync.json');
    const syncData = {
      orders: mockOrders.map(o => ({
        id: o.id,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        items: o.items,
        total: o.total,
        status: o.status,
        paymentMethod: o.paymentMethod,
        deliveryType: o.deliveryType,
        deliveryAddress: o.deliveryAddress,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt
      })),
      lastSync: new Date().toISOString()
    };
    fs.writeFileSync(websitePath, JSON.stringify(syncData, null, 2));
    console.log('✅ Pedidos sincronizados com o site!');
  } catch (error) {
    console.error('❌ Erro ao sincronizar pedidos:', error);
  }
}

// Função para importar pedidos do site para o PDV
function importOrdersFromWebsite() {
  try {
    const websitePath = path.join(__dirname, '../public/orders-from-website.json');
    
    if (!fs.existsSync(websitePath)) {
      return; // Arquivo ainda não existe
    }

    const fileContent = fs.readFileSync(websitePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    if (!data.orders || data.orders.length === 0) {
      return; // Nenhum pedido novo
    }

    // Importar pedidos que ainda não existem
    data.orders.forEach(order => {
      const exists = mockOrders.find(o => o.id === order.id);
      if (!exists) {
        mockOrders.push(order);
        
        // Atualizar ou criar cliente
        const customer = mockCustomers.find(c => c.phone === order.customerPhone);
        if (customer) {
          // Atualizar cliente existente
          customer.orderHistory.push(order.id);
          customer.totalSpent += order.total;
          customer.lastOrderDate = order.createdAt;
          if (order.deliveryAddress && order.deliveryAddress.full) {
            customer.address = order.deliveryAddress.full;
          }
        } else {
          // Criar novo cliente
          mockCustomers.push({
            id: Date.now().toString() + Math.random(),
            name: order.customerName,
            phone: order.customerPhone,
            address: order.deliveryAddress?.full,
            addressDetails: order.deliveryAddress ? {
              street: order.deliveryAddress.full?.split(',')[0] || '',
              number: '',
              complement: order.deliveryAddress.complement,
              neighborhood: '',
              city: '',
              state: '',
              zipCode: '',
              reference: order.deliveryAddress.reference
            } : undefined,
            orderHistory: [order.id],
            totalSpent: order.total,
            lastOrderDate: order.createdAt
          });
        }
        
        console.log('✅ Pedido importado do site:', order.id);
      }
    });

    // Limpar arquivo após importação
    fs.writeFileSync(websitePath, JSON.stringify({ orders: [], lastSync: new Date().toISOString() }, null, 2));
    
    // Sincronizar clientes atualizados de volta para o site
    syncCustomersToWebsite();
    syncOrdersToWebsite();
    
  } catch (error) {
    console.error('❌ Erro ao importar pedidos do site:', error);
  }
}

// Sistema de Auto-Sincronização
function startAutoSync() {
  // Sincronização inicial
  syncProductsToWebsite();
  syncCustomersToWebsite();
  syncOrdersToWebsite();
  importOrdersFromWebsite();
  
  // Verificar novos pedidos do site a cada 5 segundos (mais rápido)
  setInterval(() => {
    importOrdersFromWebsite();
  }, 5000);
  
  // Sincronizar produtos/clientes a cada 30 segundos
  setInterval(() => {
    syncProductsToWebsite();
    syncCustomersToWebsite();
    syncOrdersToWebsite();
  }, 30000);
  
  console.log('🔄 Auto-sincronização ativada!');
}

// Sincronizar ao iniciar
app.whenReady().then(() => {
  startAutoSync();
});

const mockOrders = [
  { id: '1', customerName: 'João Silva', customerPhone: '(13) 99999-1111', items: [{ product: mockProducts[0], quantity: 2 }], total: 91.80, status: 'Pendente', createdAt: new Date().toISOString() },
  { id: '2', customerName: 'Maria Santos', customerPhone: '(13) 99999-2222', items: [{ product: mockProducts[1], quantity: 1 }], total: 48.90, status: 'Preparando', createdAt: new Date().toISOString() },
];

const mockCustomers = [
  { 
    id: '1', 
    name: 'João Silva', 
    phone: '(13) 99999-1111', 
    email: 'joao@email.com',
    address: 'Rua das Flores, 123, Centro, São Vicente - SP',
    addressDetails: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Vicente',
      state: 'SP',
      zipCode: '11310-000',
      reference: 'Próximo ao mercado'
    },
    orderHistory: ['1'], 
    totalSpent: 250.00,
    lastOrderDate: new Date(Date.now() - 86400000 * 2).toISOString() // 2 dias atrás
  },
  { 
    id: '2', 
    name: 'Maria Santos', 
    phone: '(13) 99999-2222', 
    email: 'maria@email.com',
    address: 'Av. Presidente Wilson, 456, Gonzaga, Santos - SP',
    addressDetails: {
      street: 'Av. Presidente Wilson',
      number: '456',
      complement: 'Casa',
      neighborhood: 'Gonzaga',
      city: 'Santos',
      state: 'SP',
      zipCode: '11065-000',
      reference: 'Próximo à praia'
    },
    orderHistory: ['2'], 
    totalSpent: 180.00,
    lastOrderDate: new Date(Date.now() - 86400000).toISOString() // 1 dia atrás
  },
  { 
    id: '3', 
    name: 'Pedro Costa', 
    phone: '(13) 98888-3333', 
    email: 'pedro@email.com',
    address: 'Rua São Paulo, 789, Vila Mathias, Santos - SP',
    addressDetails: {
      street: 'Rua São Paulo',
      number: '789',
      neighborhood: 'Vila Mathias',
      city: 'Santos',
      state: 'SP',
      zipCode: '11015-000'
    },
    orderHistory: [], 
    totalSpent: 0,
    lastOrderDate: null
  },
];

const mockUsers = [
  { id: '1', name: 'Administrador', username: 'admin', password: 'admin123', role: 'admin', isActive: true },
  { id: '2', name: 'Operador 1', username: 'operador1', password: '123456', role: 'operator', isActive: true },
];

const mockNeighborhoods = [
  { id: '1', name: 'Centro', city: 'Santos', deliveryFee: 5.00, isActive: true, createdAt: new Date().toISOString() },
  { id: '2', name: 'Gonzaga', city: 'Santos', deliveryFee: 7.00, isActive: true, createdAt: new Date().toISOString() },
  { id: '3', name: 'José Menino', city: 'Santos', deliveryFee: 8.00, isActive: true, createdAt: new Date().toISOString() },
  { id: '4', name: 'Boqueirão', city: 'Santos', deliveryFee: 10.00, isActive: true, createdAt: new Date().toISOString() },
  { id: '5', name: 'Vila Mathias', city: 'Santos', deliveryFee: 6.00, isActive: true, createdAt: new Date().toISOString() },
];

let mockCashRegisters = [];
let currentCashRegister = null;

// Sistema de invalidação de cache
let dataVersion = {
  products: Date.now(),
  categories: Date.now(),
  lastUpdate: Date.now()
};

// Função para invalidar cache e forçar atualização
function invalidateCache(entity) {
  dataVersion[entity] = Date.now();
  dataVersion.lastUpdate = Date.now();
  console.log(`🔄 Cache invalidado: ${entity} - versão: ${dataVersion[entity]}`);
  
  // Notificar todas as janelas para recarregar dados
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('cache-invalidated', { entity, version: dataVersion[entity] });
  }
}

// Produtos
ipcMain.handle('products:getAll', async () => {
  return {
    data: mockProducts,
    version: dataVersion.products,
    timestamp: Date.now()
  };
});

ipcMain.handle('products:create', async (event, product) => {
  mockProducts.push(product);
  // Sincronizar com o site (salvar em arquivo JSON)
  syncProductsToWebsite();
  // INVALIDAR CACHE IMEDIATAMENTE
  invalidateCache('products');
  console.log('✅ Produto criado e cache invalidado:', product.name);
  return { success: true, version: dataVersion.products };
});

ipcMain.handle('products:update', async (event, id, product) => {
  const index = mockProducts.findIndex(p => p.id === id);
  if (index !== -1) {
    mockProducts[index] = { ...mockProducts[index], ...product };
    // Sincronizar com o site (salvar em arquivo JSON)
    syncProductsToWebsite();
    // INVALIDAR CACHE IMEDIATAMENTE
    invalidateCache('products');
    console.log('✅ Produto atualizado e cache invalidado:', mockProducts[index].name, '- Ativo:', mockProducts[index].isActive);
  }
  return { success: true, version: dataVersion.products };
});

ipcMain.handle('products:delete', async (event, id) => {
  const index = mockProducts.findIndex(p => p.id === id);
  if (index !== -1) {
    const deletedProduct = mockProducts[index];
    mockProducts.splice(index, 1);
    syncProductsToWebsite();
    // INVALIDAR CACHE IMEDIATAMENTE
    invalidateCache('products');
    console.log('✅ Produto deletado e cache invalidado:', deletedProduct.name);
  }
  return { success: true, version: dataVersion.products };
});

// Categorias (armazenar em memória para permitir edições)
let mockCategories = [
  { id: '1', name: 'Pizzas Grande', icon: 'local_pizza', color: '#dc2626', order: 1, isActive: true },
  { id: '2', name: 'Pizzas Broto', icon: 'local_pizza', color: '#f97316', order: 2, isActive: true },
  { id: '3', name: 'Refeições', icon: 'restaurant', color: '#ea580c', order: 3, isActive: true },
  { id: '4', name: 'Bebidas', icon: 'local_drink', color: '#0891b2', order: 4, isActive: true },
  { id: '5', name: 'Sucos', icon: 'local_cafe', color: '#16a34a', order: 5, isActive: true },
  { id: '6', name: 'Massas', icon: 'dinner_dining', color: '#ca8a04', order: 6, isActive: true },
  { id: '7', name: 'Açaí', icon: 'icecream', color: '#9333ea', order: 7, isActive: true },
  { id: '8', name: 'Porções', icon: 'fastfood', color: '#dc2626', order: 8, isActive: true },
  { id: '9', name: 'Complementos', icon: 'add_circle', color: '#8b5cf6', order: 9, isActive: true },
];

ipcMain.handle('categories:getAll', async () => {
  return {
    data: mockCategories,
    version: dataVersion.categories,
    timestamp: Date.now()
  };
});

ipcMain.handle('categories:create', async (event, category) => {
  mockCategories.push(category);
  // INVALIDAR CACHE IMEDIATAMENTE
  invalidateCache('categories');
  console.log('✅ Categoria criada e cache invalidado:', category.name);
  return { success: true, version: dataVersion.categories };
});

ipcMain.handle('categories:update', async (event, id, category) => {
  const index = mockCategories.findIndex(c => c.id === id);
  if (index !== -1) {
    mockCategories[index] = { ...mockCategories[index], ...category };
    // INVALIDAR CACHE IMEDIATAMENTE
    invalidateCache('categories');
    console.log('✅ Categoria atualizada e cache invalidado:', mockCategories[index].name, '- Ativo:', mockCategories[index].isActive);
  }
  return { success: true, version: dataVersion.categories };
});

ipcMain.handle('categories:delete', async (event, id) => {
  const index = mockCategories.findIndex(c => c.id === id);
  if (index !== -1) {
    const deletedCategory = mockCategories[index];
    mockCategories.splice(index, 1);
    // INVALIDAR CACHE IMEDIATAMENTE
    invalidateCache('categories');
    console.log('✅ Categoria deletada e cache invalidado:', deletedCategory.name);
  }
  return { success: true, version: dataVersion.categories };
});

// Handler para verificar versão dos dados (polling)
ipcMain.handle('data:getVersion', async () => {
  return dataVersion;
});

// Handler para forçar reload completo de todos os dados
ipcMain.handle('data:forceReload', async () => {
  console.log('🔄 Forçando reload completo de dados...');
  return {
    products: {
      data: mockProducts,
      version: dataVersion.products,
      timestamp: Date.now()
    },
    categories: {
      data: mockCategories,
      version: dataVersion.categories,
      timestamp: Date.now()
    }
  };
});

// Pedidos
ipcMain.handle('orders:getAll', async () => {
  return mockOrders;
});

ipcMain.handle('orders:create', async (event, order) => {
  mockOrders.push(order);
  syncOrdersToWebsite();
  return { success: true };
});

ipcMain.handle('orders:update', async (event, id, updates) => {
  const index = mockOrders.findIndex(o => o.id === id);
  if (index !== -1) {
    mockOrders[index] = { ...mockOrders[index], ...updates };
    syncOrdersToWebsite();
  }
  return { success: true };
});

ipcMain.handle('orders:getToday', async () => {
  return mockOrders;
});

// Clientes
ipcMain.handle('customers:getAll', async () => {
  return mockCustomers;
});

ipcMain.handle('customers:create', async (event, customer) => {
  mockCustomers.push(customer);
  syncCustomersToWebsite();
  return { success: true };
});

ipcMain.handle('customers:update', async (event, id, customer) => {
  const index = mockCustomers.findIndex(c => c.id === id);
  if (index !== -1) {
    mockCustomers[index] = { ...mockCustomers[index], ...customer };
    syncCustomersToWebsite();
  }
  return { success: true };
});

// Configurações da loja
ipcMain.handle('store:getConfig', async () => {
  return { name: 'Pizzaria Zattera', phone: '(13) 99651-1793', address: 'Santos, SP', openTime: '18:00', closeTime: '23:00', primaryColor: '#dc2626' };
});

ipcMain.handle('store:updateConfig', async (event, config) => {
  return { success: true };
});

// Usuários (Autenticação)
ipcMain.handle('users:authenticate', async (event, username, password) => {
  const user = mockUsers.find(u => u.username === username && u.password === password && u.isActive);
  if (user) {
    return { id: user.id, name: user.name, username: user.username, role: user.role };
  }
  return null;
});

ipcMain.handle('users:getAll', async () => {
  return mockUsers.map(u => ({ id: u.id, name: u.name, username: u.username, role: u.role, isActive: u.isActive }));
});

ipcMain.handle('users:create', async (event, user) => {
  const newUser = { ...user, id: Date.now().toString(), isActive: true };
  mockUsers.push(newUser);
  return { success: true, id: newUser.id };
});

ipcMain.handle('users:update', async (event, id, user) => {
  const index = mockUsers.findIndex(u => u.id === id);
  if (index !== -1) {
    mockUsers[index] = { ...mockUsers[index], ...user };
    return { success: true };
  }
  return { success: false, error: 'Usuário não encontrado' };
});

ipcMain.handle('users:delete', async (event, id) => {
  const userToDelete = mockUsers.find(u => u.id === id);
  const adminCount = mockUsers.filter(u => u.role === 'admin' && u.isActive).length;
  
  if (userToDelete?.role === 'admin' && adminCount <= 1) {
    return { success: false, error: 'Não é possível deletar o último administrador' };
  }
  
  const index = mockUsers.findIndex(u => u.id === id);
  if (index !== -1) {
    mockUsers.splice(index, 1);
    return { success: true };
  }
  return { success: false, error: 'Usuário não encontrado' };
});

// Impressão (preparado para futuro)
ipcMain.handle('printer:print', async (event, data) => {
  // TODO: Implementar impressão térmica
  console.log('Print:', data);
  return { success: true };
});

// Exportar dados (backup)
ipcMain.handle('data:export', async () => {
  return { products: mockProducts, orders: mockOrders, customers: mockCustomers };
});

// Importar dados (restaurar backup)
ipcMain.handle('data:import', async (event, data) => {
  return { success: true };
});

// WhatsApp - Enviar mensagem
ipcMain.handle('whatsapp:sendMessage', async (event, phone, message) => {
  try {
    // Remove caracteres especiais do telefone
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não tiver (Brasil = 55)
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
    
    // Codifica a mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Monta URL do WhatsApp
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedMessage}`;
    
    // Abre WhatsApp Web no navegador
    await shell.openExternal(whatsappUrl);
    
    console.log(`✅ WhatsApp aberto para: ${phone}`);
    console.log(`📱 Mensagem: ${message}`);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao abrir WhatsApp:', error);
    return { success: false, error: error.message };
  }
});

// Bairros
ipcMain.handle('neighborhoods:getAll', async () => {
  console.log('📋 [ELECTRON] Retornando bairros:', mockNeighborhoods.length, 'bairros');
  return mockNeighborhoods;
});

ipcMain.handle('neighborhoods:create', async (event, neighborhood) => {
  console.log('📍 [ELECTRON] Recebendo requisição para criar bairro:', neighborhood);
  
  const newNeighborhood = {
    ...neighborhood,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  
  mockNeighborhoods.push(newNeighborhood);
  console.log('✅ [ELECTRON] Bairro criado:', newNeighborhood);
  console.log('📋 [ELECTRON] Total de bairros:', mockNeighborhoods.length);
  
  return { success: true, neighborhood: newNeighborhood };
});

ipcMain.handle('neighborhoods:update', async (event, neighborhood) => {
  console.log('✏️ [ELECTRON] Atualizando bairro:', neighborhood);
  const index = mockNeighborhoods.findIndex(n => n.id === neighborhood.id);
  if (index !== -1) {
    mockNeighborhoods[index] = neighborhood;
    console.log('✅ [ELECTRON] Bairro atualizado com sucesso');
  } else {
    console.log('❌ [ELECTRON] Bairro não encontrado:', neighborhood.id);
  }
  return { success: true };
});

ipcMain.handle('neighborhoods:delete', async (event, id) => {
  const index = mockNeighborhoods.findIndex(n => n.id === id);
  if (index !== -1) {
    mockNeighborhoods.splice(index, 1);
  }
  return { success: true };
});

// Caixa - Usando banco de dados real
ipcMain.handle('cashRegister:getAll', async () => {
  try {
    return database.getAllCashRegisters();
  } catch (error) {
    console.error('Erro ao buscar caixas:', error);
    return [];
  }
});

ipcMain.handle('cashRegister:getCurrent', async () => {
  try {
    return database.getCurrentCashRegister();
  } catch (error) {
    console.error('Erro ao buscar caixa atual:', error);
    return null;
  }
});

ipcMain.handle('cashRegister:open', async (event, data) => {
  try {
    // Verificar se já existe um caixa aberto
    const current = database.getCurrentCashRegister();
    if (current) {
      return { success: false, error: 'Já existe um caixa aberto' };
    }
    
    return database.openCashRegister(data);
  } catch (error) {
    console.error('Erro ao abrir caixa:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cashRegister:close', async (event, data) => {
  try {
    return database.closeCashRegister(data.id, {
      closedBy: data.closedBy,
      finalAmount: data.finalAmount
    });
  } catch (error) {
    console.error('Erro ao fechar caixa:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cashRegister:addTransaction', async (event, cashId, transaction) => {
  try {
    return database.addCashTransaction(cashId, transaction);
  } catch (error) {
    console.error('Erro ao adicionar transação:', error);
    return { success: false, error: error.message };
  }
});

// Sistema - Abrir URL externa no navegador padrão
ipcMain.handle('system:openExternal', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('Erro ao abrir URL:', error);
    return { success: false, error: error.message };
  }
});
