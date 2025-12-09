'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category, Order, Customer, StoreConfig } from '../types';

interface AdminDashboardProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  customers: Customer[];
  storeConfig: StoreConfig;
  setStoreConfig: React.Dispatch<React.SetStateAction<StoreConfig>>;
  onExit: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  setProducts,
  categories,
  setCategories,
  orders,
  setOrders,
  customers,
  storeConfig,
  setStoreConfig,
  onExit,
}) => {
  const [activeTab, setActiveTab] = useState<'pdv' | 'orders' | 'products' | 'categories' | 'customers' | 'analytics'>('pdv');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // PDV State
  const [pdvCart, setPdvCart] = useState<any[]>([]);
  const [pdvCustomer, setPdvCustomer] = useState('');
  const [pdvPayment, setPdvPayment] = useState('dinheiro');

  // Real-time orders update simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simula atualização em tempo real
      const pendingOrders = orders.filter(o => o.status === 'Pendente' || o.status === 'Preparando');
      if (pendingOrders.length > 0) {
        // Notificação sonora ou visual
        console.log('Pedidos pendentes:', pendingOrders.length);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [orders]);

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    
    // Converte para base64 (em produção, usar serviço de storage)
    const reader = new FileReader();
    reader.onloadend = () => {
      if (editingProduct) {
        setEditingProduct({ ...editingProduct, image: reader.result as string });
      }
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Product Handlers
  const toggleProductStatus = (productId: string) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, isActive: !p.isActive } : p
      )
    );
  };

  const saveProduct = () => {
    if (!editingProduct) return;
    
    setProducts(prev => {
      const exists = prev.find(p => p.id === editingProduct.id);
      if (exists) {
        return prev.map(p => p.id === editingProduct.id ? editingProduct : p);
      }
      return [...prev, editingProduct];
    });
    setEditingProduct(null);
  };

  const deleteProduct = (id: string) => {
    if (confirm('Deseja realmente excluir este produto?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // Category Handlers
  const toggleCategoryStatus = (categoryId: string) => {
    setCategories(prev =>
      prev.map(c =>
        c.id === categoryId ? { ...c, isActive: !c.isActive } : c
      )
    );
  };

  const saveCategory = () => {
    if (!editingCategory) return;
    
    setCategories(prev => {
      const exists = prev.find(c => c.id === editingCategory.id);
      if (exists) {
        return prev.map(c => c.id === editingCategory.id ? editingCategory : c);
      }
      return [...prev, editingCategory];
    });
    setEditingCategory(null);
  };

  const deleteCategory = (id: string) => {
    if (confirm('Deseja realmente excluir esta categoria?')) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  // Order Handlers
  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, status: newStatus, updatedAt: new Date().toISOString() }
          : o
      )
    );
  };

  // PDV Handlers
  const addToPdvCart = (product: Product) => {
    setPdvCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const finalizePdvSale = () => {
    if (pdvCart.length === 0) {
      alert('Adicione produtos ao carrinho');
      return;
    }

    const total = pdvCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      date: new Date().toISOString(),
      items: pdvCart,
      total,
      status: 'Preparando',
      paymentMethod: pdvPayment,
      deliveryType: 'pickup',
      customerName: pdvCustomer || 'Cliente Balcão',
      createdAt: new Date().toISOString(),
    };

    setOrders(prev => [newOrder, ...prev]);
    setPdvCart([]);
    setPdvCustomer('');
    alert('Venda finalizada com sucesso!');
  };

  // Analytics
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.date);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const activeProducts = products.filter(p => p.isActive !== false).length;
  const pendingOrders = orders.filter(o => o.status === 'Pendente' || o.status === 'Preparando').length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-icons-round text-3xl">dashboard</span>
            <div>
              <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
              <p className="text-sm text-gray-300">{storeConfig.name}</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{todayOrders.length}</p>
              <p className="text-xs text-gray-300">Pedidos Hoje</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">R$ {todayRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-300">Faturamento</p>
            </div>
            <div className="text-center relative">
              <p className="text-2xl font-bold text-yellow-400">{pendingOrders}</p>
              <p className="text-xs text-gray-300">Pendentes</p>
              {pendingOrders > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </div>
          </div>

          <button
            onClick={onExit}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <span className="material-icons-round">exit_to_app</span>
            Sair
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-4 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'pdv', label: 'PDV', icon: 'point_of_sale' },
            { id: 'orders', label: 'Pedidos', icon: 'receipt_long' },
            { id: 'products', label: 'Produtos', icon: 'inventory_2' },
            { id: 'categories', label: 'Categorias', icon: 'category' },
            { id: 'customers', label: 'Clientes', icon: 'people' },
            { id: 'analytics', label: 'Analytics', icon: 'analytics' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              <span className="material-icons-round text-xl">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        {/* PDV TAB */}
        {activeTab === 'pdv' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Products Selection */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                {products
                  .filter(p => p.isActive !== false)
                  .filter(p => 
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.category.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToPdvCart(product)}
                      className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-left"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded-lg mb-2"
                      />
                      <h3 className="font-bold text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.category}</p>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        R$ {product.price.toFixed(2)}
                      </p>
                    </button>
                  ))}
              </div>
            </div>

            {/* Cart & Checkout */}
            <div className="bg-white rounded-xl shadow-lg p-4 sticky top-24 h-fit">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="material-icons-round">shopping_cart</span>
                Carrinho PDV
              </h2>

              <input
                type="text"
                placeholder="Nome do cliente (opcional)"
                value={pdvCustomer}
                onChange={e => setPdvCustomer(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4"
              />

              <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                {pdvCart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">R$ {item.price.toFixed(2)} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPdvCart(prev =>
                            prev.map((i, index) =>
                              index === idx && i.quantity > 1
                                ? { ...i, quantity: i.quantity - 1 }
                                : i
                            )
                          );
                        }}
                        className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="font-bold">{item.quantity}</span>
                      <button
                        onClick={() => {
                          setPdvCart(prev =>
                            prev.map((i, index) =>
                              index === idx ? { ...i, quantity: i.quantity + 1 } : i
                            )
                          );
                        }}
                        className="w-6 h-6 bg-blue-500 text-white rounded flex items-center justify-center"
                      >
                        +
                      </button>
                      <button
                        onClick={() => setPdvCart(prev => prev.filter((_, i) => i !== idx))}
                        className="ml-2 text-red-500"
                      >
                        <span className="material-icons-round text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between mb-4">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-2xl text-green-600">
                    R$ {pdvCart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                  </span>
                </div>

                <select
                  value={pdvPayment}
                  onChange={e => setPdvPayment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-4"
                >
                  <option value="dinheiro">💵 Dinheiro</option>
                  <option value="debito">💳 Débito</option>
                  <option value="credito">💳 Crédito</option>
                  <option value="pix">📱 PIX</option>
                </select>

                <button
                  onClick={finalizePdvSale}
                  className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-icons-round">check_circle</span>
                  Finalizar Venda
                </button>

                <button
                  onClick={() => setPdvCart([])}
                  className="w-full py-2 mt-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Limpar Carrinho
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="material-icons-round">receipt_long</span>
                Gestão de Pedidos em Tempo Real
              </h2>

              {/* Status Filter */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['Todos', 'Pendente', 'Preparando', 'Pronto', 'Saiu para Entrega', 'Entregue', 'Concluído'].map(status => (
                  <button
                    key={status}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold whitespace-nowrap"
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Orders List */}
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <span className="material-icons-round text-6xl mb-2">inbox</span>
                    <p>Nenhum pedido ainda</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div
                      key={order.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg">Pedido #{order.id.slice(-6)}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(order.date).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-sm font-semibold mt-1">
                            {order.customerName || 'Cliente'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            R$ {order.total.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">{order.paymentMethod}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mb-3">
                        {order.items.map((item, idx) => (
                          <p key={idx} className="text-sm text-gray-600">
                            {item.quantity}x {item.name}
                          </p>
                        ))}
                      </div>

                      {/* Status Update */}
                      <div className="flex gap-2 flex-wrap">
                        {['Pendente', 'Preparando', 'Pronto', 'Saiu para Entrega', 'Entregue', 'Concluído'].map(status => (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(order.id, status as Order['status'])}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                              order.status === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="material-icons-round">inventory_2</span>
                  Gestão de Produtos
                </h2>
                <button
                  onClick={() =>
                    setEditingProduct({
                      id: `prod-${Date.now()}`,
                      name: '',
                      description: '',
                      price: 0,
                      category: 'Salgada',
                      image: 'https://via.placeholder.com/400',
                      isActive: true,
                      stock: 999,
                    })
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  <span className="material-icons-round">add</span>
                  Novo Produto
                </button>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div
                    key={product.id}
                    className={`border-2 rounded-lg p-4 ${
                      product.isActive === false
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                    <p className="text-xl font-bold text-green-600 mb-3">
                      R$ {product.price.toFixed(2)}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleProductStatus(product.id)}
                        className={`flex-1 py-2 rounded-lg font-semibold ${
                          product.isActive === false
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {product.isActive === false ? 'Ativar' : 'Pausar'}
                      </button>
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        <span className="material-icons-round text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <span className="material-icons-round text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="material-icons-round">category</span>
                  Gestão de Categorias
                </h2>
                <button
                  onClick={() =>
                    setEditingCategory({
                      id: `cat-${Date.now()}`,
                      name: '',
                      icon: 'category',
                      color: '#3B82F6',
                      order: categories.length,
                      isActive: true,
                      createdAt: new Date().toISOString(),
                    })
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  <span className="material-icons-round">add</span>
                  Nova Categoria
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className={`border-2 rounded-lg p-4 ${
                      category.isActive === false
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: category.color }}
                      >
                        <span className="material-icons-round text-white">
                          {category.icon}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{category.name}</h3>
                        <p className="text-xs text-gray-500">Ordem: {category.order}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleCategoryStatus(category.id)}
                        className={`flex-1 py-2 rounded-lg font-semibold ${
                          category.isActive === false
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {category.isActive === false ? 'Ativar' : 'Pausar'}
                      </button>
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        <span className="material-icons-round text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <span className="material-icons-round text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="material-icons-round">people</span>
                  Banco de Dados de Clientes
                </h2>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{customers.length}</p>
                  <p className="text-sm text-gray-500">Clientes Cadastrados</p>
                </div>
              </div>

              {/* Lista de Clientes */}
              <div className="space-y-3">
                {customers.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <span className="material-icons-round text-6xl mb-2">person_off</span>
                    <p>Nenhum cliente cadastrado ainda</p>
                  </div>
                ) : (
                  customers.map(customer => (
                    <div
                      key={customer.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="material-icons-round text-blue-600">person</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{customer.name}</h3>
                            <p className="text-sm text-gray-600">
                              <span className="material-icons-round text-xs align-middle">phone</span> {customer.phone}
                            </p>
                            {customer.email && (
                              <p className="text-sm text-gray-600">
                                <span className="material-icons-round text-xs align-middle">email</span> {customer.email}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{customer.orders.length}</p>
                          <p className="text-xs text-gray-500">Pedidos</p>
                        </div>
                      </div>

                      {/* Histórico de Pedidos do Cliente */}
                      {customer.orders.length > 0 && (
                        <div className="mt-4 border-t pt-3">
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">📋 Histórico de Pedidos:</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {customer.orders.map((order, idx) => (
                              <div key={order.id} className="bg-gray-50 p-2 rounded text-xs">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-semibold">Pedido #{order.id.slice(-6)}</span>
                                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                                    order.status === 'Concluído' || order.status === 'Entregue'
                                      ? 'bg-green-100 text-green-700'
                                      : order.status === 'Cancelado'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {order.status}
                                  </span>
                                </div>
                                <p className="text-gray-600">
                                  {new Date(order.date).toLocaleDateString('pt-BR')} • 
                                  R$ {order.total.toFixed(2)} • 
                                  {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Estatísticas do Cliente */}
                      <div className="mt-3 flex gap-4 text-xs">
                        <div className="bg-blue-50 px-3 py-1 rounded-full">
                          <span className="font-semibold text-blue-700">
                            Total Gasto: R$ {customer.orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-purple-50 px-3 py-1 rounded-full">
                          <span className="font-semibold text-purple-700">
                            Cliente desde: {new Date(customer.orders[0]?.date || Date.now()).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="material-icons-round text-blue-500 text-3xl">shopping_cart</span>
                  <span className="text-sm text-gray-500">Hoje</span>
                </div>
                <p className="text-3xl font-bold">{todayOrders.length}</p>
                <p className="text-sm text-gray-600">Pedidos</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="material-icons-round text-green-500 text-3xl">attach_money</span>
                  <span className="text-sm text-gray-500">Hoje</span>
                </div>
                <p className="text-3xl font-bold">R$ {todayRevenue.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Faturamento</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="material-icons-round text-orange-500 text-3xl">inventory</span>
                  <span className="text-sm text-gray-500">Total</span>
                </div>
                <p className="text-3xl font-bold">{activeProducts}</p>
                <p className="text-sm text-gray-600">Produtos Ativos</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="material-icons-round text-purple-500 text-3xl">people</span>
                  <span className="text-sm text-gray-500">Total</span>
                </div>
                <p className="text-3xl font-bold">{customers.length}</p>
                <p className="text-sm text-gray-600">Clientes</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Produtos Mais Vendidos</h2>
              <div className="space-y-2">
                {products.slice(0, 5).map((product, idx) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-400">#{idx + 1}</span>
                      <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-semibold">{product.name}</span>
                    </div>
                    <span className="text-green-600 font-bold">R$ {product.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingProduct.id.startsWith('prod-') ? 'Novo Produto' : 'Editar Produto'}
              </h2>
              <button onClick={() => setEditingProduct(null)}>
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block font-semibold mb-2">Imagem do Produto</label>
                <div className="flex gap-4">
                  <img
                    src={editingProduct.image}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2"
                  />
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="block w-full py-3 px-4 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200 text-center font-semibold"
                    >
                      <span className="material-icons-round align-middle">photo_camera</span>
                      {uploadingImage ? 'Enviando...' : 'Tirar Foto / Upload'}
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Use a câmera do celular ou faça upload do computador
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Nome</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Descrição</label>
                <textarea
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Estoque</label>
                  <input
                    type="number"
                    value={editingProduct.stock || 999}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Categoria</label>
                <select
                  value={editingProduct.category}
                  onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.isFeatured}
                    onChange={e => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="font-semibold">Produto em Destaque</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.isActive !== false}
                    onChange={e => setEditingProduct({ ...editingProduct, isActive: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="font-semibold">Produto Ativo</span>
                </label>
              </div>

              <button
                onClick={saveProduct}
                className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <span className="material-icons-round">check_circle</span>
                Salvar Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingCategory.id.startsWith('cat-') ? 'Nova Categoria' : 'Editar Categoria'}
              </h2>
              <button onClick={() => setEditingCategory(null)}>
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block font-semibold mb-2">Nome da Categoria</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Ícone (Material Icons)</label>
                <input
                  type="text"
                  value={editingCategory.icon}
                  onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                  placeholder="Ex: local_pizza, cake, local_bar"
                  className="w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Cor</label>
                <input
                  type="color"
                  value={editingCategory.color}
                  onChange={e => setEditingCategory({ ...editingCategory, color: e.target.value })}
                  className="w-full h-12 rounded-lg border-2 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Ordem de Exibição</label>
                <input
                  type="number"
                  value={editingCategory.order}
                  onChange={e => setEditingCategory({ ...editingCategory, order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingCategory.isActive}
                  onChange={e => setEditingCategory({ ...editingCategory, isActive: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="font-semibold">Categoria Ativa</span>
              </label>

              <button
                onClick={saveCategory}
                className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <span className="material-icons-round">check_circle</span>
                Salvar Categoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
