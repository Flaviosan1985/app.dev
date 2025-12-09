const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class PDVDatabase {
  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'pizzaria-zattera.db');
    
    this.db = new Database(dbPath, { verbose: console.log });
    this.initializeTables();
  }

  initializeTables() {
    // Tabela de Produtos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        image TEXT,
        isActive INTEGER DEFAULT 1,
        isFeatured INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 999,
        preparationTime INTEGER DEFAULT 30,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Categorias
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT DEFAULT 'category',
        color TEXT DEFAULT '#dc2626',
        order_position INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Pedidos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customerName TEXT NOT NULL,
        customerPhone TEXT NOT NULL,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'Pendente',
        paymentMethod TEXT,
        deliveryType TEXT,
        deliveryAddress TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Clientes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        email TEXT,
        address TEXT,
        orderHistory TEXT,
        totalSpent REAL DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Usuários (Administradores e Operadores)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'operator')),
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar usuário admin padrão se não existir
    const adminExists = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
    if (adminExists.count === 0) {
      const adminId = Date.now().toString();
      this.db.prepare(`
        INSERT INTO users (id, name, username, password, role)
        VALUES (?, ?, ?, ?, ?)
      `).run(adminId, 'Administrador', 'admin', 'admin123', 'admin');
    }

    // Tabela de Configurações
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS store_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inserir configurações padrão se não existirem
    const defaultConfig = {
      name: 'Pizzaria Zattera',
      phone: '(13) 99651-1793',
      address: 'Santos, SP',
      openTime: '18:00',
      closeTime: '23:00',
      primaryColor: '#dc2626'
    };

    const configExists = this.db.prepare('SELECT COUNT(*) as count FROM store_config').get();
    if (configExists.count === 0) {
      const insert = this.db.prepare('INSERT INTO store_config (key, value) VALUES (?, ?)');
      for (const [key, value] of Object.entries(defaultConfig)) {
        insert.run(key, value);
      }
    }

    // Tabela de Caixa (Cash Register)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cash_registers (
        id TEXT PRIMARY KEY,
        openedBy TEXT NOT NULL,
        openedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        closedBy TEXT,
        closedAt TEXT,
        initialAmount REAL NOT NULL DEFAULT 0,
        finalAmount REAL,
        expectedAmount REAL,
        difference REAL,
        status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed')),
        transactions TEXT DEFAULT '[]'
      )
    `);
  }

  // ===== PRODUTOS =====
  getAllProducts() {
    return this.db.prepare('SELECT * FROM products ORDER BY name').all();
  }

  createProduct(product) {
    const stmt = this.db.prepare(`
      INSERT INTO products (id, name, description, price, category, image, isActive, isFeatured, stock, preparationTime)
      VALUES (@id, @name, @description, @price, @category, @image, @isActive, @isFeatured, @stock, @preparationTime)
    `);
    return stmt.run(product);
  }

  updateProduct(id, product) {
    const stmt = this.db.prepare(`
      UPDATE products 
      SET name = @name, description = @description, price = @price, category = @category,
          image = @image, isActive = @isActive, isFeatured = @isFeatured, 
          stock = @stock, preparationTime = @preparationTime, updatedAt = CURRENT_TIMESTAMP
      WHERE id = @id
    `);
    return stmt.run({ ...product, id });
  }

  deleteProduct(id) {
    return this.db.prepare('DELETE FROM products WHERE id = ?').run(id);
  }

  // ===== CATEGORIAS =====
  getAllCategories() {
    return this.db.prepare('SELECT * FROM categories ORDER BY order_position').all();
  }

  createCategory(category) {
    const stmt = this.db.prepare(`
      INSERT INTO categories (id, name, icon, color, order_position, isActive)
      VALUES (@id, @name, @icon, @color, @order_position, @isActive)
    `);
    return stmt.run(category);
  }

  updateCategory(id, category) {
    const stmt = this.db.prepare(`
      UPDATE categories 
      SET name = @name, icon = @icon, color = @color, 
          order_position = @order_position, isActive = @isActive
      WHERE id = @id
    `);
    return stmt.run({ ...category, id });
  }

  deleteCategory(id) {
    return this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }

  // ===== PEDIDOS =====
  getAllOrders() {
    const orders = this.db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
    return orders.map(order => ({
      ...order,
      items: JSON.parse(order.items),
      deliveryAddress: order.deliveryAddress ? JSON.parse(order.deliveryAddress) : null
    }));
  }

  createOrder(order) {
    const stmt = this.db.prepare(`
      INSERT INTO orders (id, customerName, customerPhone, items, total, status, paymentMethod, deliveryType, deliveryAddress)
      VALUES (@id, @customerName, @customerPhone, @items, @total, @status, @paymentMethod, @deliveryType, @deliveryAddress)
    `);
    return stmt.run({
      ...order,
      items: JSON.stringify(order.items),
      deliveryAddress: order.deliveryAddress ? JSON.stringify(order.deliveryAddress) : null
    });
  }

  updateOrder(id, order) {
    const stmt = this.db.prepare(`
      UPDATE orders 
      SET status = @status, updatedAt = CURRENT_TIMESTAMP
      WHERE id = @id
    `);
    return stmt.run({ ...order, id });
  }

  getTodayOrders() {
    const today = new Date().toISOString().split('T')[0];
    const orders = this.db.prepare(
      "SELECT * FROM orders WHERE date(createdAt) = date('now') ORDER BY createdAt DESC"
    ).all();
    return orders.map(order => ({
      ...order,
      items: JSON.parse(order.items),
      deliveryAddress: order.deliveryAddress ? JSON.parse(order.deliveryAddress) : null
    }));
  }

  // ===== CLIENTES =====
  getAllCustomers() {
    const customers = this.db.prepare('SELECT * FROM customers ORDER BY name').all();
    return customers.map(customer => ({
      ...customer,
      orderHistory: customer.orderHistory ? JSON.parse(customer.orderHistory) : []
    }));
  }

  createCustomer(customer) {
    const stmt = this.db.prepare(`
      INSERT INTO customers (id, name, phone, email, address, orderHistory, totalSpent)
      VALUES (@id, @name, @phone, @email, @address, @orderHistory, @totalSpent)
    `);
    return stmt.run({
      ...customer,
      orderHistory: JSON.stringify(customer.orderHistory || [])
    });
  }

  updateCustomer(id, customer) {
    const stmt = this.db.prepare(`
      UPDATE customers 
      SET name = @name, phone = @phone, email = @email, address = @address,
          orderHistory = @orderHistory, totalSpent = @totalSpent, updatedAt = CURRENT_TIMESTAMP
      WHERE id = @id
    `);
    return stmt.run({
      ...customer,
      id,
      orderHistory: JSON.stringify(customer.orderHistory || [])
    });
  }

  // ===== CONFIGURAÇÕES =====
  getStoreConfig() {
    const rows = this.db.prepare('SELECT key, value FROM store_config').all();
    return rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  }

  updateStoreConfig(config) {
    const stmt = this.db.prepare(`
      INSERT INTO store_config (key, value, updatedAt) 
      VALUES (@key, @value, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = @value, updatedAt = CURRENT_TIMESTAMP
    `);
    
    for (const [key, value] of Object.entries(config)) {
      stmt.run({ key, value });
    }
    return true;
  }

  // ===== USUÁRIOS (ADMIN/OPERADORES) =====
  authenticateUser(username, password) {
    const user = this.db.prepare(`
      SELECT * FROM users WHERE username = ? AND password = ? AND isActive = 1
    `).get(username, password);
    
    if (user) {
      return {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      };
    }
    return null;
  }

  getAllUsers() {
    return this.db.prepare('SELECT id, name, username, role, isActive, createdAt FROM users ORDER BY createdAt DESC').all();
  }

  createUser(user) {
    const id = Date.now().toString();
    this.db.prepare(`
      INSERT INTO users (id, name, username, password, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, user.name, user.username, user.password, user.role);
    return id;
  }

  updateUser(id, user) {
    this.db.prepare(`
      UPDATE users 
      SET name = ?, username = ?, password = ?, role = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(user.name, user.username, user.password, user.role, user.isActive ? 1 : 0, id);
    return true;
  }

  deleteUser(id) {
    // Não permite deletar se for o último admin
    const adminCount = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND isActive = 1').get('admin');
    const userToDelete = this.db.prepare('SELECT role FROM users WHERE id = ?').get(id);
    
    if (userToDelete?.role === 'admin' && adminCount.count <= 1) {
      throw new Error('Não é possível deletar o último administrador');
    }
    
    this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return true;
  }

  // ===== BACKUP/RESTORE =====
  exportData() {
    return {
      products: this.getAllProducts(),
      categories: this.getAllCategories(),
      orders: this.getAllOrders(),
      customers: this.getAllCustomers(),
      config: this.getStoreConfig(),
      exportDate: new Date().toISOString()
    };
  }

  importData(data) {
    const transaction = this.db.transaction(() => {
      // Limpar tabelas
      this.db.prepare('DELETE FROM products').run();
      this.db.prepare('DELETE FROM categories').run();
      this.db.prepare('DELETE FROM orders').run();
      this.db.prepare('DELETE FROM customers').run();

      // Importar dados
      if (data.products) {
        data.products.forEach(product => this.createProduct(product));
      }
      if (data.categories) {
        data.categories.forEach(category => this.createCategory(category));
      }
      if (data.orders) {
        data.orders.forEach(order => this.createOrder(order));
      }
      if (data.customers) {
        data.customers.forEach(customer => this.createCustomer(customer));
      }
      if (data.config) {
        this.updateStoreConfig(data.config);
      }
    });

    transaction();
    return true;
  }

  // ===== CAIXA (CASH REGISTER) =====
  getAllCashRegisters() {
    const registers = this.db.prepare('SELECT * FROM cash_registers ORDER BY openedAt DESC').all();
    return registers.map(reg => ({
      ...reg,
      transactions: JSON.parse(reg.transactions || '[]')
    }));
  }

  getCurrentCashRegister() {
    const register = this.db.prepare('SELECT * FROM cash_registers WHERE status = ? ORDER BY openedAt DESC LIMIT 1').get('open');
    if (register) {
      return {
        ...register,
        transactions: JSON.parse(register.transactions || '[]')
      };
    }
    return null;
  }

  openCashRegister(data) {
    const id = `cash-${Date.now()}`;
    this.db.prepare(`
      INSERT INTO cash_registers (id, openedBy, initialAmount, status)
      VALUES (?, ?, ?, 'open')
    `).run(id, data.openedBy, data.initialAmount);
    
    return { success: true, id };
  }

  closeCashRegister(id, data) {
    const register = this.db.prepare('SELECT * FROM cash_registers WHERE id = ?').get(id);
    if (!register) {
      return { success: false, error: 'Caixa não encontrado' };
    }

    const transactions = JSON.parse(register.transactions || '[]');
    const salesTotal = transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
    const withdrawalsTotal = transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
    const depositsTotal = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
    const expectedAmount = register.initialAmount + salesTotal - withdrawalsTotal + depositsTotal;
    const difference = data.finalAmount - expectedAmount;

    this.db.prepare(`
      UPDATE cash_registers 
      SET closedBy = ?, closedAt = CURRENT_TIMESTAMP, finalAmount = ?, 
          expectedAmount = ?, difference = ?, status = 'closed'
      WHERE id = ?
    `).run(data.closedBy, data.finalAmount, expectedAmount, difference, id);

    return { success: true };
  }

  addCashTransaction(cashId, transaction) {
    const register = this.db.prepare('SELECT transactions FROM cash_registers WHERE id = ?').get(cashId);
    if (!register) {
      throw new Error('Caixa não encontrado');
    }

    const transactions = JSON.parse(register.transactions || '[]');
    transactions.push(transaction);

    this.db.prepare(`
      UPDATE cash_registers 
      SET transactions = ?
      WHERE id = ?
    `).run(JSON.stringify(transactions), cashId);

    return { success: true };
  }

  close() {
    this.db.close();
  }
}

module.exports = PDVDatabase;
