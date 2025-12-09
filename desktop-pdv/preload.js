const { contextBridge, ipcRenderer } = require('electron');

// Expor API segura para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Produtos
  products: {
    getAll: () => ipcRenderer.invoke('products:getAll'),
    create: (product) => ipcRenderer.invoke('products:create', product),
    update: (id, product) => ipcRenderer.invoke('products:update', id, product),
    delete: (id) => ipcRenderer.invoke('products:delete', id),
  },
  
  // Categorias
  categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    create: (category) => ipcRenderer.invoke('categories:create', category),
    update: (id, category) => ipcRenderer.invoke('categories:update', id, category),
    delete: (id) => ipcRenderer.invoke('categories:delete', id),
  },
  
  // Pedidos
  orders: {
    getAll: () => ipcRenderer.invoke('orders:getAll'),
    create: (order) => ipcRenderer.invoke('orders:create', order),
    update: (id, order) => ipcRenderer.invoke('orders:update', id, order),
    getToday: () => ipcRenderer.invoke('orders:getToday'),
  },
  
  // Clientes
  customers: {
    getAll: () => ipcRenderer.invoke('customers:getAll'),
    create: (customer) => ipcRenderer.invoke('customers:create', customer),
    update: (id, customer) => ipcRenderer.invoke('customers:update', id, customer),
  },
  
  // Configurações
  store: {
    getConfig: () => ipcRenderer.invoke('store:getConfig'),
    updateConfig: (config) => ipcRenderer.invoke('store:updateConfig', config),
  },
  
  // Usuários (Autenticação)
  users: {
    authenticate: (username, password) => ipcRenderer.invoke('users:authenticate', username, password),
    getAll: () => ipcRenderer.invoke('users:getAll'),
    create: (user) => ipcRenderer.invoke('users:create', user),
    update: (id, user) => ipcRenderer.invoke('users:update', id, user),
    delete: (id) => ipcRenderer.invoke('users:delete', id),
  },
  
  // Impressora
  printer: {
    print: (data) => ipcRenderer.invoke('printer:print', data),
  },
  
  // WhatsApp
  whatsapp: {
    sendMessage: (phone, message) => ipcRenderer.invoke('whatsapp:sendMessage', phone, message),
  },
  
  // Bairros
  neighborhoods: {
    getAll: () => ipcRenderer.invoke('neighborhoods:getAll'),
    create: (neighborhood) => ipcRenderer.invoke('neighborhoods:create', neighborhood),
    update: (neighborhood) => ipcRenderer.invoke('neighborhoods:update', neighborhood),
    delete: (id) => ipcRenderer.invoke('neighborhoods:delete', id),
  },
  
  // Caixa
  cashRegister: {
    getAll: () => ipcRenderer.invoke('cashRegister:getAll'),
    getCurrent: () => ipcRenderer.invoke('cashRegister:getCurrent'),
    open: (data) => ipcRenderer.invoke('cashRegister:open', data),
    close: (id, data) => ipcRenderer.invoke('cashRegister:close', { id, ...data }),
    addTransaction: (cashId, transaction) => ipcRenderer.invoke('cashRegister:addTransaction', { cashId, transaction }),
  },
  
  // Backup/Restore e Cache
  data: {
    export: () => ipcRenderer.invoke('data:export'),
    getVersion: () => ipcRenderer.invoke('data:getVersion'),
    forceReload: () => ipcRenderer.invoke('data:forceReload'),
    onCacheInvalidated: (callback) => {
      ipcRenderer.on('cache-invalidated', (event, data) => callback(data));
    },
    import: (data) => ipcRenderer.invoke('data:import', data),
  },
  
  // Sistema
  system: {
    openExternal: (url) => ipcRenderer.invoke('system:openExternal', url),
  },
});
