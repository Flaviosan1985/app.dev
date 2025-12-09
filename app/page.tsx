'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CategoryType, Product, CartItem, StoreConfig, Customer, Order, Category, Complement } from '../types';
import { INITIAL_PRODUCTS, INITIAL_STORE_CONFIG, INITIAL_CUSTOMERS, INITIAL_CATEGORIES } from '../constants';
import { ProductCard } from '../components/ProductCard';
import { AIImageEditor } from '../components/AIImageEditor';
import { AdminDashboard } from '../components/AdminDashboard';

// Constante da promoção
const PROMO_MIN_VALUE = 86.00;
const PROMO_PRIZE = 'Refrigerante Frutuba 2 litros';

// --- Admin Component ---

interface AdminProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  customers: Customer[];
  storeConfig: StoreConfig;
  setStoreConfig: React.Dispatch<React.SetStateAction<StoreConfig>>;
  onExit: () => void;
}

const AdminPanel: React.FC<AdminProps> = ({ products, setProducts, customers, storeConfig, setStoreConfig, onExit }) => {
  const [activeTab, setActiveTab] = useState<'store' | 'products' | 'customers'>('store');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAIEditor, setShowAIEditor] = useState(false);
  const [tempImage, setTempImage] = useState<string>('');

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setProducts(prev => {
      const exists = prev.find(p => p.id === editingProduct.id);
      if (exists) {
        return prev.map(p => p.id === editingProduct.id ? editingProduct : p);
      } else {
        return [...prev, editingProduct];
      }
    });
    setEditingProduct(null);
  };

  const createNewProduct = () => {
    setEditingProduct({
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0,
      category: CategoryType.SALTY,
      image: 'https://picsum.photos/400/400',
      isFeatured: false
    });
  };

  const handleDelete = (id: string) => {
    if(confirm('Tem certeza que deseja excluir este item?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-slate-800 text-white p-4 sticky top-0 z-30 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="material-icons-round">admin_panel_settings</span>
            <h1 className="text-xl font-bold">Administração</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-700 rounded p-1">
             <button onClick={() => setActiveTab('store')} className={`px-3 py-1 rounded text-sm ${activeTab === 'store' ? 'bg-slate-500 text-white' : 'text-gray-300'}`}>Loja</button>
             <button onClick={() => setActiveTab('products')} className={`px-3 py-1 rounded text-sm ${activeTab === 'products' ? 'bg-slate-500 text-white' : 'text-gray-300'}`}>Produtos</button>
             <button onClick={() => setActiveTab('customers')} className={`px-3 py-1 rounded text-sm ${activeTab === 'customers' ? 'bg-slate-500 text-white' : 'text-gray-300'}`}>Clientes</button>
          </div>
          <button onClick={onExit} className="text-sm bg-red-600 px-3 py-1 rounded hover:bg-red-700">
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-8">
        
        {/* Store Settings */}
        {activeTab === 'store' && (
        <section className="bg-white p-6 rounded-xl shadow-sm animate-fadeIn">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Configurações da Loja</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm text-gray-600">Nome da Pizzaria</label>
                <input 
                  value={storeConfig.name}
                  onChange={e => setStoreConfig({...storeConfig, name: e.target.value})}
                  className="w-full p-2 border rounded mt-1"
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-sm text-gray-600">Abertura</label>
                    <input 
                      type="time"
                      value={storeConfig.openTime}
                      onChange={e => setStoreConfig({...storeConfig, openTime: e.target.value})}
                      className="w-full p-2 border rounded mt-1"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-600">Fechamento</label>
                    <input 
                      type="time"
                      value={storeConfig.closeTime}
                      onChange={e => setStoreConfig({...storeConfig, closeTime: e.target.value})}
                      className="w-full p-2 border rounded mt-1"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm text-gray-600">Cor Primária</label>
                <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="color"
                      value={storeConfig.primaryColor}
                      onChange={e => setStoreConfig({...storeConfig, primaryColor: e.target.value})}
                      className="h-10 w-20 rounded cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">{storeConfig.primaryColor}</span>
                </div>
            </div>
            <div>
                 <label className="flex items-center gap-2 mt-6 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={storeConfig.isOpen}
                      onChange={e => setStoreConfig({...storeConfig, isOpen: e.target.checked})}
                      className="w-5 h-5"
                    />
                    <span className="font-medium">Loja Aberta Agora</span>
                 </label>
            </div>
          </div>
        </section>
        )}

        {/* Product List */}
        {activeTab === 'products' && (
        <section className="bg-white p-6 rounded-xl shadow-sm animate-fadeIn">
           <div className="flex justify-between items-center mb-4 border-b pb-2">
             <h2 className="text-lg font-bold">Produtos</h2>
             <button 
               onClick={createNewProduct}
               className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
             >
               <span className="material-icons-round">add</span> Novo Produto
             </button>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="text-gray-500 text-sm border-b">
                   <th className="p-3 font-medium">Imagem</th>
                   <th className="p-3 font-medium">Nome</th>
                   <th className="p-3 font-medium">Categoria</th>
                   <th className="p-3 font-medium">Preço</th>
                   <th className="p-3 font-medium">Destaque</th>
                   <th className="p-3 font-medium text-right">Ações</th>
                 </tr>
               </thead>
               <tbody>
                 {products.map(p => (
                   <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                     <td className="p-3">
                        <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded" />
                     </td>
                     <td className="p-3 font-medium">{p.name}</td>
                     <td className="p-3 text-sm text-gray-600">{p.category}</td>
                     <td className="p-3 text-sm">R$ {p.price.toFixed(2)}</td>
                     <td className="p-3 text-sm text-center">
                        {p.isFeatured && <span className="material-icons-round text-yellow-500">star</span>}
                     </td>
                     <td className="p-3 text-right space-x-2">
                       <button onClick={() => setEditingProduct(p)} className="text-blue-600 hover:text-blue-800">
                         <span className="material-icons-round">edit</span>
                       </button>
                       <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800">
                         <span className="material-icons-round">delete</span>
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </section>
        )}

        {/* Customers List */}
        {activeTab === 'customers' && (
          <section className="bg-white p-6 rounded-xl shadow-sm animate-fadeIn">
             <h2 className="text-lg font-bold mb-4 border-b pb-2">Clientes Cadastrados</h2>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="text-gray-500 text-sm border-b">
                     <th className="p-3 font-medium">Nome</th>
                     <th className="p-3 font-medium">Telefone</th>
                     <th className="p-3 font-medium">Endereço</th>
                     <th className="p-3 font-medium text-center">Pedidos</th>
                   </tr>
                 </thead>
                 <tbody>
                   {customers.map(c => (
                     <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                       <td className="p-3 font-medium">
                          {c.name}
                          <div className="text-xs text-gray-400">{c.email}</div>
                       </td>
                       <td className="p-3 text-sm">{c.phone}</td>
                       <td className="p-3 text-sm max-w-xs truncate">{c.address}</td>
                       <td className="p-3 text-sm text-center">{c.orders.length}</td>
                     </tr>
                   ))}
                   {customers.length === 0 && (
                      <tr><td colSpan={4} className="p-4 text-center text-gray-400">Nenhum cliente cadastrado.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </section>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <h3 className="text-xl font-bold mb-4">
                 {products.find(p => p.id === editingProduct.id) ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nome</label>
                <input 
                  required
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Descrição / Ingredientes</label>
                <textarea 
                  required
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full p-2 border rounded h-24"
                  placeholder="Ex: Molho, mussarela, tomate..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Preço (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Categoria</label>
                  <select 
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value as CategoryType})}
                    className="w-full p-2 border rounded"
                  >
                    {Object.values(CategoryType).map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input 
                    type="checkbox"
                    checked={editingProduct.isFeatured || false}
                    onChange={e => setEditingProduct({...editingProduct, isFeatured: e.target.checked})}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="font-medium text-gray-700">Destaque (Promoção/Combo)</span>
              </label>

              <div>
                 <label className="block text-sm text-gray-600 mb-1">Imagem URL</label>
                 <div className="flex gap-2">
                    <input 
                        type="text"
                        value={editingProduct.image}
                        onChange={e => setEditingProduct({...editingProduct, image: e.target.value})}
                        className="flex-1 p-2 border rounded"
                    />
                    <button 
                        type="button"
                        onClick={() => {
                            setTempImage(editingProduct.image);
                            setShowAIEditor(true);
                        }}
                        className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 flex items-center gap-1 shadow"
                        title="Editar com IA"
                    >
                        <span className="material-icons-round text-sm">auto_awesome</span>
                        IA
                    </button>
                 </div>
                 {editingProduct.image && (
                     <img src={editingProduct.image} alt="Preview" className="mt-2 h-32 w-full object-cover rounded bg-gray-50" />
                 )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button 
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Editor Modal */}
      {showAIEditor && (
        <AIImageEditor 
            initialImage={tempImage}
            onClose={() => setShowAIEditor(false)}
            onImageSave={(newBase64) => {
                if(editingProduct) {
                    setEditingProduct({...editingProduct, image: newBase64});
                }
                setShowAIEditor(false);
            }}
        />
      )}
    </div>
  );
};

// --- Client App ---

const App: React.FC = () => {
  // Data State com persistência
  const [view, setView] = useState<'client' | 'admin'>('client');
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zattera_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    }
    return INITIAL_PRODUCTS;
  });
  const [lastSyncVersion, setLastSyncVersion] = useState<number>(0);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(INITIAL_STORE_CONFIG);
  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zattera_customers');
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    }
    return INITIAL_CUSTOMERS;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zattera_categories');
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    }
    return INITIAL_CATEGORIES;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zattera_orders');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Estado de complementos (bordas)
  const [complements, setComplements] = useState<Complement[]>([]);

  // Sincronização em tempo real (LocalStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zattera_products', JSON.stringify(products));
      // Disparar evento para sincronizar entre abas
      window.dispatchEvent(new Event('storage'));
    }
  }, [products]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zattera_categories', JSON.stringify(categories));
      window.dispatchEvent(new Event('storage'));
    }
  }, [categories]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zattera_orders', JSON.stringify(orders));
      window.dispatchEvent(new Event('storage'));
    }
  }, [orders]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zattera_customers', JSON.stringify(customers));
      window.dispatchEvent(new Event('storage'));
    }
  }, [customers]);

  // Listener para sincronizar mudanças em tempo real entre abas
  useEffect(() => {
    const handleStorageChange = () => {
      const savedProducts = localStorage.getItem('zattera_products');
      const savedCategories = localStorage.getItem('zattera_categories');
      const savedOrders = localStorage.getItem('zattera_orders');
      const savedCustomers = localStorage.getItem('zattera_customers');
      
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedCategories) setCategories(JSON.parse(savedCategories));
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 🔄 SINCRONIZAÇÃO COM PDV/ADMIN - Carregar produtos do arquivo JSON
  const syncWithPDV = async () => {
    try {
      // Adicionar cache buster para evitar cache do navegador
      const cacheBuster = Date.now();
      const response = await fetch(`/products-sync.json?v=${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.log('⚠️ Arquivo de sincronização não encontrado, usando dados locais');
        return;
      }

      const data = await response.json();
      
      // Verificar se há nova versão
      if (data.version && data.version === lastSyncVersion) {
        console.log('✅ Produtos já estão atualizados (versão:', data.version, ')');
        return;
      }

      if (data.products && Array.isArray(data.products)) {
        // Separar produtos e complementos
        const allItems = data.products.filter((p: any) => p.isActive !== false);
        
        // Filtrar complementos (bordas)
        const pdvComplements = allItems
          .filter((p: any) => p.type === 'complement')
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: p.price,
            priceSmall: p.priceSmall,
            category: p.category,
            image: p.image,
            isFeatured: false,
            isActive: p.isActive !== false,
            stock: p.stock || 999,
            preparationTime: 0,
            type: 'complement' as const
          } as Complement));
        
        // Filtrar produtos normais
        const pdvProducts = allItems
          .filter((p: any) => p.type !== 'complement')
          .map((p: any) => {
            // Mapear categorias do PDV para CategoryType do site
            let category = p.category;
            const categoryMap: {[key: string]: CategoryType} = {
              'pizzas': CategoryType.SALTY,
              'refeicoes': CategoryType.SALTY,
              'massas': CategoryType.SALTY,
              'porcoes': CategoryType.SALTY,
              'bebidas': CategoryType.DRINK,
              'sucos': CategoryType.DRINK,
              'acai': CategoryType.SWEET,
              'sobremesas': CategoryType.SWEET,
              'doces': CategoryType.SWEET,
            };
            
            // Tentar mapear, senão manter original
            if (categoryMap[p.category.toLowerCase()]) {
              category = categoryMap[p.category.toLowerCase()];
            }
            
            return {
              id: p.id,
              name: p.name,
              description: p.description || '',
              price: p.price,
              priceSmall: p.priceSmall,
              category: category,
              image: p.image,
              isFeatured: p.isFeatured || false,
              isActive: p.isActive !== false,
              stock: p.stock || 999,
              preparationTime: p.preparationTime || 30,
              type: p.type
            } as Product;
          });
        
        // Merge: Manter produtos locais (criados no site) + produtos do PDV
        const localOnlyProducts = products.filter(p => 
          !pdvProducts.find((pdvP: Product) => pdvP.id === p.id)
        );
        
        const mergedProducts = [...pdvProducts, ...localOnlyProducts];
        
        setProducts(mergedProducts);
        setComplements(pdvComplements);
        
        if (data.version) {
          setLastSyncVersion(data.version);
        }
        
        console.log('🔄 Produtos sincronizados com PDV/Admin:', {
          produtos: pdvProducts.length,
          complementos: pdvComplements.length,
          local: localOnlyProducts.length,
          total: mergedProducts.length,
          version: data.version,
          lastSync: data.lastSync
        });
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar produtos do PDV:', error);
    }
  };

  // Sincronizar ao carregar a página
  useEffect(() => {
    console.log('🚀 Iniciando sincronização com PDV/Admin...');
    syncWithPDV();
  }, []);

  // Polling periódico: Sincronizar a cada 10 segundos (mais rápido para teste)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      console.log('🔄 Verificando atualizações do PDV/Admin...');
      syncWithPDV();
    }, 10 * 1000); // 10 segundos

    return () => clearInterval(syncInterval);
  }, [lastSyncVersion]);
  
  // User Session State
  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType>(CategoryType.SALTY);
  const [exitingItems, setExitingItems] = useState<Set<string>>(new Set()); // Track items animating out
  
  // Half-Half Modal State
  const [isHalfModalOpen, setIsHalfModalOpen] = useState(false);
  const [halfSelections, setHalfSelections] = useState<[Product | null, Product | null]>([null, null]);

  // Pizza Selector Modal State
  const [showPizzaSelector, setShowPizzaSelector] = useState(false);
  const [selectedPizza, setSelectedPizza] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<'grande' | 'broto'>('grande');
  const [selectedComplementIds, setSelectedComplementIds] = useState<string[]>([]);

  // Auth Form State
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });

  // Delivery/Pickup State
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup' | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState({ street: '', number: '', neighborhood: '', complement: '', reference: '' });
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'debito' | 'credito' | 'pix' | null>(null);
  const [changeFor, setChangeFor] = useState<string>('');

  // Scroll State
  const [isScrolled, setIsScrolled] = useState(false);

  // Computed
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const itemPrice = item.price;
      const complementsPrice = item.complementsPrice || 0;
      return sum + ((itemPrice + complementsPrice) * item.quantity);
    }, 0);
  }, [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const filteredProducts = useMemo(() => {
      return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  // --- Auth Handlers ---
  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      const user = customers.find(c => c.phone === authForm.phone);
      if (user) {
          setCurrentUser(user);
          setShowAuthModal(null);
          setAuthForm({ name: '', email: '', phone: '', password: '' });
          setIsAuthenticated(true);
      } else {
          alert("Telefone não encontrado. Por favor, cadastre-se primeiro.");
          setShowAuthModal('register');
      }
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      if (customers.some(c => c.phone === authForm.phone)) {
          alert("Telefone já cadastrado. Faça login.");
          setShowAuthModal('login');
          return;
      }
      const newCustomer: Customer = {
          id: `cust-${Date.now()}`,
          name: authForm.name,
          email: authForm.email || `${authForm.phone}@temp.com`,
          phone: authForm.phone,
          password: authForm.phone,
          address: '',
          orders: []
      };
      setCustomers(prev => [...prev, newCustomer]);
      setCurrentUser(newCustomer);
      setShowAuthModal(null);
      setAuthForm({ name: '', email: '', phone: '', password: '' });
      setIsAuthenticated(true);
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setShowProfile(false);
      setIsAuthenticated(false);
  };

  // --- Scroll Effect ---
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Cart Logic ---
  const addToCart = (product: Product) => {
    if (!storeConfig.isOpen) {
        alert("Desculpe, estamos fechados no momento.");
        return;
    }

    // Se for pizza (salgada ou meio a meio), abrir modal de seleção
    if (product.category === CategoryType.SALTY || product.category === CategoryType.HALF) {
      setSelectedPizza(product);
      setSelectedSize('grande');
      setSelectedComplementIds([]);
      setShowPizzaSelector(true);
      return;
    }

    // Para outros produtos, adicionar diretamente ao carrinho
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && !item.isHalf);
      if (existing) {
        return prev.map(item => item.id === product.id && !item.isHalf 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, cartId: Date.now().toString(), quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  // Adicionar pizza ao carrinho com complementos selecionados
  const addPizzaToCart = () => {
    if (!selectedPizza) return;

    const selectedComplementsList = complements.filter(c => selectedComplementIds.includes(c.id));
    const complementsPrice = selectedComplementsList.reduce((sum, c) => sum + c.price, 0);
    const finalPrice = selectedSize === 'grande' 
      ? selectedPizza.price 
      : (selectedPizza.priceSmall || selectedPizza.price * 0.7);

    const newItem: CartItem = {
      ...selectedPizza,
      cartId: Date.now().toString(),
      quantity: 1,
      size: selectedSize,
      selectedComplements: selectedComplementsList,
      complementsPrice: complementsPrice,
      price: finalPrice
    };

    setCart(prev => [...prev, newItem]);
    setShowPizzaSelector(false);
    setSelectedPizza(null);
    setSelectedComplementIds([]);
    setIsCartOpen(true);
  };

  const addHalfHalfToCart = () => {
    const [p1, p2] = halfSelections;
    if (!p1 || !p2) return;

    const higherPrice = Math.max(p1.price, p2.price);
    const name = `1/2 ${p1.name} + 1/2 ${p2.name}`;
    
    const selectedComplementsList = complements.filter(c => selectedComplementIds.includes(c.id));
    const complementsPrice = selectedComplementsList.reduce((sum, c) => sum + c.price, 0);
    
    const newItem: CartItem = {
        id: `half-${Date.now()}`,
        cartId: `cart-half-${Date.now()}`,
        name: name,
        description: 'Pizza Meio a Meio Personalizada',
        price: higherPrice,
        category: CategoryType.HALF,
        image: 'https://picsum.photos/seed/half/400/400', // Generic image for half/half
        quantity: 1,
        isHalf: true,
        size: 'grande',
        selectedComplements: selectedComplementsList,
        complementsPrice: complementsPrice
    };

    setCart(prev => [...prev, newItem]);
    setIsHalfModalOpen(false);
    setHalfSelections([null, null]);
    setSelectedComplementIds([]);
    setIsCartOpen(true);
  };

  const removeFromCartWithAnimation = (cartId: string) => {
    // Add to exiting set to trigger animation
    setExitingItems(prev => new Set(prev).add(cartId));
    
    // Wait for animation to finish before actual removal
    setTimeout(() => {
        setCart(prev => prev.filter(item => item.cartId !== cartId));
        setExitingItems(prev => {
            const next = new Set(prev);
            next.delete(cartId);
            return next;
        });
    }, 300); // Duration must match CSS animation
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
        if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
    }));
  };

  const finalizeOrder = () => {
      if (!currentUser) {
          setShowAuthModal('login');
          return;
      }
      setIsCartOpen(false);
      setShowDeliveryModal(true);
  };

  const confirmOrder = () => {
      if (!currentUser || !deliveryType || !paymentMethod) {
          alert('Por favor, selecione a forma de pagamento.');
          return;
      }

      // Validar endereço se for delivery
      if (deliveryType === 'delivery') {
          if (!deliveryAddress.street || !deliveryAddress.number || !deliveryAddress.neighborhood) {
              alert('Por favor, preencha todos os campos obrigatórios do endereço.');
              return;
          }
      }
      
      // Validar troco se for dinheiro
      if (paymentMethod === 'dinheiro' && changeFor) {
          const changeValue = parseFloat(changeFor);
          if (isNaN(changeValue) || changeValue < cartTotal) {
              alert('O valor para troco deve ser maior que o total do pedido.');
              return;
          }
      }

      // Salvar pedido no histórico
      const newOrder: Order = {
          id: `ord-${Date.now()}`,
          date: new Date().toISOString(),
          items: [...cart],
          total: cartTotal,
          status: 'Pendente',
          paymentMethod: paymentMethod || 'Não informado',
          deliveryType: deliveryType,
          deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : undefined,
          customerName: currentUser.name,
          customerPhone: currentUser.phone,
          createdAt: new Date().toISOString(),
      };
      
      const updatedUser = { ...currentUser, orders: [newOrder, ...currentUser.orders] };
      setCurrentUser(updatedUser);
      setCustomers(prev => prev.map(c => c.id === currentUser.id ? updatedUser : c));
      
      // Adicionar ao sistema de pedidos do admin
      setOrders(prev => [newOrder, ...prev]);

      // Montar mensagem do WhatsApp
      const clientInfo = `Cliente: ${currentUser.name}%0ATelefone: ${currentUser.phone}`;
      const orderItems = cart.map(i => `${i.quantity}x ${i.name} - R$ ${(i.price * i.quantity).toFixed(2)}`).join('%0A');
      
      // Adicionar brinde se atingiu o valor mínimo
      const promoItem = cartTotal >= PROMO_MIN_VALUE ? `%0A%0A🎁 BRINDE: 1x ${PROMO_PRIZE} GRÁTIS!` : '';
      
      let deliveryInfo = '';
      if (deliveryType === 'delivery') {
          deliveryInfo = `%0A%0A🚚 ENTREGA%0AEndereço: ${deliveryAddress.street}, ${deliveryAddress.number}%0ABairro: ${deliveryAddress.neighborhood}`;
          if (deliveryAddress.complement) deliveryInfo += `%0AComplemento: ${deliveryAddress.complement}`;
          if (deliveryAddress.reference) deliveryInfo += `%0AReferência: ${deliveryAddress.reference}`;
      } else {
          deliveryInfo = `%0A%0A🏪 RETIRADA NO LOCAL%0APrevisão: 30 minutos`;
      }
      
      // Informação de pagamento
      const paymentLabels = {
          dinheiro: '💵 Dinheiro',
          debito: '💳 Cartão de Débito',
          credito: '💳 Cartão de Crédito',
          pix: '📱 PIX'
      };
      let paymentInfo = `%0A%0A💰 *Forma de Pagamento:* ${paymentLabels[paymentMethod]}`;
      if (paymentMethod === 'dinheiro' && changeFor) {
          const changeValue = parseFloat(changeFor);
          const trocoValue = changeValue - cartTotal;
          paymentInfo += `%0ALevar troco para: R$ ${changeValue.toFixed(2)}%0ATroco: R$ ${trocoValue.toFixed(2)}`;
      }
      
      const msg = `🍕 *NOVO PEDIDO - Pizzaria Zattera*%0A%0A${clientInfo}%0A%0A*Itens do Pedido:*%0A${orderItems}${promoItem}%0A%0A*Total: R$ ${cartTotal.toFixed(2)}*${paymentInfo}${deliveryInfo}`;
      
      // Enviar para WhatsApp da pizzaria
      window.open(`https://wa.me/5513996511793?text=${msg}`, '_blank');
      
      // Limpar estados
      setCart([]);
      setShowDeliveryModal(false);
      setDeliveryType(null);
      setDeliveryAddress({ street: '', number: '', neighborhood: '', complement: '', reference: '' });
      setPaymentMethod(null);
      setChangeFor('');
      
      // Mostrar mensagem de confirmação
      if (deliveryType === 'pickup') {
          alert('✅ Pedido confirmado!\n\nSeu pedido está sendo preparado.\nTempo estimado para retirada: 30 minutos.');
      } else {
          alert('✅ Pedido confirmado!\n\nSeu pedido foi enviado para a pizzaria.\nEm breve você receberá a confirmação via WhatsApp.');
      }
  };

  // Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminForm.username === 'admin' && adminForm.password === 'adm123') {
      setView('admin');
      setShowAdminModal(false);
      setAdminForm({ username: '', password: '' });
    } else {
      alert('❌ Usuário ou senha incorretos!');
    }
  };

  // Salvar novo pedido quando finalizado
  const saveOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  if (view === 'admin') {
    return (
        <AdminDashboard 
            products={products} 
            setProducts={setProducts}
            categories={categories}
            setCategories={setCategories}
            orders={orders}
            setOrders={setOrders}
            customers={customers}
            storeConfig={storeConfig}
            setStoreConfig={setStoreConfig}
            onExit={() => setView('client')}
        />
    );
  }

  // Login Screen (antes de entrar no site)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ 
        backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {/* Overlay escuro para melhorar legibilidade */}
        <div className="absolute inset-0 bg-black/40"></div>
        {/* Pizza Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Pizza 1 - Top Left */}
          <div className="absolute -top-20 -left-20 w-64 h-64 opacity-15">
            <div className="w-full h-full rounded-full bg-gray-600 shadow-[0_25px_50px_rgba(0,0,0,0.9)] flex items-center justify-center">
              <span className="material-icons-round text-gray-800 opacity-60" style={{ fontSize: '180px' }}>local_pizza</span>
            </div>
          </div>
          
          {/* Pizza 2 - Bottom Right */}
          <div className="absolute -bottom-32 -right-32 w-96 h-96 opacity-15">
            <div className="w-full h-full rounded-full bg-gray-600 shadow-[0_25px_50px_rgba(0,0,0,0.9)] flex items-center justify-center">
              <span className="material-icons-round text-gray-800 opacity-60" style={{ fontSize: '240px' }}>local_pizza</span>
            </div>
          </div>
          
          {/* Pizza 3 - Middle Right */}
          <div className="absolute top-1/3 -right-16 w-48 h-48 opacity-15">
            <div className="w-full h-full rounded-full bg-gray-600 shadow-[0_20px_40px_rgba(0,0,0,0.9)] flex items-center justify-center">
              <span className="material-icons-round text-gray-800 opacity-60" style={{ fontSize: '140px' }}>local_pizza</span>
            </div>
          </div>
          
          {/* Pizza 4 - Top Right Corner */}
          <div className="absolute top-10 right-20 w-32 h-32 opacity-15">
            <div className="w-full h-full rounded-full bg-gray-600 shadow-[0_15px_30px_rgba(0,0,0,0.9)] flex items-center justify-center">
              <span className="material-icons-round text-gray-800 opacity-60" style={{ fontSize: '100px' }}>local_pizza</span>
            </div>
          </div>
          
          {/* Pizza 5 - Bottom Left */}
          <div className="absolute bottom-20 left-10 w-40 h-40 opacity-15">
            <div className="w-full h-full rounded-full bg-gray-600 shadow-[0_18px_35px_rgba(0,0,0,0.9)] flex items-center justify-center">
              <span className="material-icons-round text-gray-800 opacity-60" style={{ fontSize: '120px' }}>local_pizza</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative z-10">
          {/* Header */}
          <div className="bg-black text-white p-4 sm:p-8 text-center">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-lg">
              <span className="material-icons-round text-white text-3xl sm:text-4xl">local_pizza</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">{storeConfig.name}</h1>
            <p className="text-gray-300 text-xs sm:text-sm">Bem-vindo! Faça login para continuar</p>
          </div>

          {/* Login Form */}
          <div className="p-4 sm:p-8">
            {showAuthModal === 'register' ? (
              // Formulário de Cadastro
              <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-6">Criar Conta</h2>
                
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={authForm.name}
                    onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-sm"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Telefone (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    value={authForm.phone}
                    onChange={e => setAuthForm({ ...authForm, phone: e.target.value })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-sm"
                    placeholder="(13) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Email (opcional)</label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-sm"
                    placeholder="seu@email.com"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 sm:py-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <span className="material-icons-round text-lg sm:text-2xl">person_add</span>
                  Cadastrar
                </button>

                <button
                  type="button"
                  onClick={() => setShowAuthModal('login')}
                  className="w-full py-2 sm:py-3 text-gray-600 hover:text-gray-800 font-semibold transition-colors text-xs sm:text-base"
                >
                  Já tenho conta. Fazer login
                </button>
              </form>
            ) : (
              // Formulário de Login
              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-6">Entrar</h2>
                
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Telefone (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    value={authForm.phone}
                    onChange={e => setAuthForm({ ...authForm, phone: e.target.value })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-sm"
                    placeholder="(13) 99999-9999"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 sm:py-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <span className="material-icons-round text-lg sm:text-2xl">login</span>
                  Entrar no Site
                </button>

                <button
                  type="button"
                  onClick={() => setShowAuthModal('register')}
                  className="w-full py-2 sm:py-3 text-gray-600 hover:text-gray-800 font-semibold transition-colors text-xs sm:text-base"
                >
                  Primeira vez aqui? Cadastre-se
                </button>
              </form>
            )}

            {/* Info */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="material-icons-round text-red-600 text-base sm:text-xl">info</span>
                <div className="text-[10px] sm:text-xs text-gray-600">
                  <p className="font-semibold text-red-700 mb-1">Seus dados estão seguros</p>
                  <p>Use seu telefone para fazer login rapidamente.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Login Modal */}
        {showAdminModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
              <div className="bg-red-600 text-white p-4 sm:p-6 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <span className="material-icons-round text-white text-3xl sm:text-4xl">admin_panel_settings</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">Acesso Administrativo</h2>
                <p className="text-red-100 text-xs sm:text-sm mt-1">Área restrita</p>
              </div>

              <form onSubmit={handleAdminLogin} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Credenciais de teste */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 mb-3">
                  <p className="text-[10px] sm:text-xs text-blue-800 font-semibold mb-1">🔑 Credenciais de acesso:</p>
                  <p className="text-[10px] sm:text-xs text-blue-700">Usuário: <span className="font-mono font-bold">admin</span></p>
                  <p className="text-[10px] sm:text-xs text-blue-700">Senha: <span className="font-mono font-bold">adm123</span></p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Usuário</label>
                  <input
                    type="text"
                    required
                    value={adminForm.username}
                    onChange={e => setAdminForm({ ...adminForm, username: e.target.value })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-sm"
                    placeholder="Digite o usuário"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Senha</label>
                  <input
                    type="password"
                    required
                    value={adminForm.password}
                    onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-sm"
                    placeholder="Digite a senha"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminModal(false);
                      setAdminForm({ username: '', password: '' });
                    }}
                    className="flex-1 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all text-xs sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 sm:py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-base"
                  >
                    <span className="material-icons-round text-base sm:text-xl">login</span>
                    Entrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className={`sticky top-0 z-20 shadow-md transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md' : 'bg-black'}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3 text-white">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="material-icons-round text-white text-xl sm:text-2xl">local_pizza</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold leading-none">{storeConfig.name}</h1>
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs opacity-90 mt-0.5 sm:mt-1">
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${storeConfig.isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span>
                <span className="hidden xs:inline">{storeConfig.isOpen ? `Aberto • Fecha às ${storeConfig.closeTime}` : `Fechado • Abre às ${storeConfig.openTime}`}</span>
                <span className="xs:hidden">{storeConfig.isOpen ? 'Aberto' : 'Fechado'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-3">
             {currentUser ? (
                 <button 
                   onClick={() => setShowProfile(true)}
                   className="flex items-center gap-1 sm:gap-2 text-white hover:bg-white/20 py-1 px-2 sm:px-3 rounded-full transition-colors"
                 >
                   <span className="material-icons-round text-xl sm:text-2xl">account_circle</span>
                   <span className="text-xs sm:text-sm font-medium hidden md:inline">Olá, {currentUser.name.split(' ')[0]}</span>
                 </button>
             ) : (
                 <button 
                   onClick={() => setShowAuthModal('login')}
                   className="flex items-center gap-1 text-white hover:bg-white/20 py-1 px-2 sm:px-3 rounded-full transition-colors"
                 >
                   <span className="material-icons-round text-xl sm:text-2xl">login</span>
                   <span className="text-xs sm:text-sm font-medium hidden md:inline">Entrar</span>
                 </button>
             )}

             {currentUser && (
                 <button 
                   onClick={handleLogout}
                   className="flex items-center gap-1 text-white hover:bg-red-500/20 py-1 px-2 sm:px-3 rounded-full transition-colors border border-white/20"
                 >
                   <span className="material-icons-round text-xl sm:text-2xl">logout</span>
                   <span className="text-xs sm:text-sm font-medium hidden md:inline">Sair</span>
                 </button>
             )}

             <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-1.5 sm:p-2 text-green-400 hover:bg-white/20 rounded-full transition-colors"
             >
                <span className="material-icons-round text-2xl sm:text-3xl">shopping_cart</span>
                {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:top-0 sm:right-0 bg-yellow-400 text-red-900 text-[10px] sm:text-xs font-bold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-transparent">
                    {cartCount}
                </span>
                )}
             </button>
          </div>
        </div>
        
        {/* Categories Scroller */}
        <div className="overflow-x-auto hide-scrollbar bg-white/10 backdrop-blur-md">
            <div className="flex max-w-7xl mx-auto px-3 sm:px-4">
                {Object.values(CategoryType).map(cat => (
                    <button
                        key={cat}
                        onClick={() => {
                            if(cat === CategoryType.HALF) {
                                setIsHalfModalOpen(true);
                            } else {
                                setActiveCategory(cat);
                            }
                        }}
                        className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold whitespace-nowrap border-b-2 sm:border-b-4 transition-colors ${
                            activeCategory === cat && cat !== CategoryType.HALF
                            ? 'border-white text-white' 
                            : 'border-transparent text-white/70 hover:text-white'
                        }`}
                    >
                        {cat === CategoryType.COMBO ? (
                           <span className="flex items-center gap-0.5 sm:gap-1">
                             <span className="material-icons-round text-yellow-300 text-sm sm:text-base">local_offer</span>
                             {cat}
                           </span>
                        ) : cat}
                    </button>
                ))}
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Banner/Notice */}
        {!storeConfig.isOpen && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-r flex items-center gap-3">
                <span className="material-icons-round">storefront</span>
                <p>O estabelecimento está fechado no momento. Você pode navegar pelo cardápio, mas não é possível fazer pedidos.</p>
            </div>
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            {activeCategory === CategoryType.SALTY && <span className="material-icons-round text-orange-500">local_pizza</span>}
            {activeCategory === CategoryType.SWEET && <span className="material-icons-round text-pink-500">cake</span>}
            {activeCategory === CategoryType.DRINK && <span className="material-icons-round text-blue-500">local_bar</span>}
            {activeCategory === CategoryType.COMBO && <span className="material-icons-round text-yellow-500">stars</span>}
            {activeCategory}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAdd={addToCart}
                        primaryColor={storeConfig.primaryColor}
                    />
                ))
            ) : (
                <div className="col-span-full text-center py-10 text-gray-400">
                    <span className="material-icons-round text-4xl mb-2">sentiment_dissatisfied</span>
                    <p>Nenhum item disponível nesta categoria.</p>
                </div>
            )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-8 mt-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <h3 className="font-bold text-xl text-white mb-2">{storeConfig.name}</h3>
              <p className="text-gray-400 text-sm mb-4">As melhores pizzas da cidade, feitas com amor.</p>
              
              {/* Endereço */}
              <a 
                href="https://share.google/E60F89byljklCQ3i3" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-300 hover:text-green-400 transition-colors mb-6"
              >
                <span className="material-icons-round text-xl">location_on</span>
                <span className="text-sm">Ver localização no Google Maps</span>
              </a>
              
              {/* Redes Sociais */}
              <div className="flex justify-center gap-4 mb-6">
                  <a 
                    href="https://www.facebook.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors shadow-md"
                    aria-label="Facebook"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  
                  <a 
                    href="https://www.instagram.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 flex items-center justify-center text-white transition-all shadow-md"
                    aria-label="Instagram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  
                  <a 
                    href="https://wa.me/5513996511793" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors shadow-md"
                    aria-label="WhatsApp"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
              </div>
              
              <p className="text-xs text-gray-500">
                &copy; 2024 {storeConfig.name}. Todos os direitos reservados.
              </p>
          </div>
      </footer>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
            <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col transform transition-transform">
                <div className="p-3 sm:p-4 bg-green-600 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsCartOpen(false)} className="text-white hover:bg-green-700 rounded-full p-1" title="Voltar">
                            <span className="material-icons-round">arrow_back</span>
                        </button>
                        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                            <span className="material-icons-round text-xl sm:text-2xl">shopping_bag</span>
                            Seu Pedido
                        </h2>
                    </div>
                    <button onClick={() => setIsCartOpen(false)} className="text-white hover:bg-green-700 rounded-full p-1" title="Fechar">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                             <span className="material-icons-round text-6xl mb-4 text-gray-300">remove_shopping_cart</span>
                             <p>Seu carrinho está vazio.</p>
                             <button 
                                onClick={() => setIsCartOpen(false)}
                                className="mt-4 text-green-600 font-bold hover:underline"
                             >
                                Ver Cardápio
                             </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div 
                                    key={item.cartId} 
                                    className={`flex gap-3 bg-white border rounded-lg p-2 shadow-sm relative overflow-hidden ${exitingItems.has(item.cartId) ? 'cart-item-exit' : 'cart-item-enter'}`}
                                >
                                    <div className="w-14 h-14 bg-gray-100 rounded-md overflow-hidden shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-bold text-gray-800 text-sm leading-tight truncate pr-6">{item.name}</h4>
                                        </div>
                                        
                                        {/* Tamanho e Categoria */}
                                        <div className="flex items-center gap-2">
                                            {item.size && (
                                                <span className="text-xs text-gray-600 font-medium capitalize">{item.size}</span>
                                            )}
                                            <p className="text-xs text-gray-500 truncate">{item.isHalf ? 'Meio a Meio' : item.category}</p>
                                        </div>
                                        
                                        {/* Complementos Selecionados */}
                                        {item.selectedComplements && item.selectedComplements.length > 0 && (
                                            <div className="mt-1">
                                                {item.selectedComplements.map(comp => (
                                                    <div key={comp.id} className="text-xs text-purple-600 flex items-center gap-1">
                                                        <span className="material-icons-round text-xs">add_circle</span>
                                                        <span>{comp.name} {comp.price > 0 && `(+R$ ${comp.price.toFixed(2)})`}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="font-bold text-green-700 text-sm">
                                                R$ {((item.price + (item.complementsPrice || 0)) * item.quantity).toFixed(2)}
                                            </span>
                                            
                                            {/* Compact Quantity Controls */}
                                            <div className="flex items-center bg-gray-100 rounded-md h-7">
                                                <button 
                                                    onClick={() => updateQuantity(item.cartId, -1)} 
                                                    className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-red-600 disabled:opacity-50"
                                                >
                                                    <span className="material-icons-round text-xs">remove</span>
                                                </button>
                                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item.cartId, 1)} 
                                                    className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-green-600"
                                                >
                                                    <span className="material-icons-round text-xs">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCartWithAnimation(item.cartId)} 
                                        className="absolute top-1 right-1 text-gray-300 hover:text-red-500 p-1"
                                    >
                                        <span className="material-icons-round text-sm">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-3 sm:p-4 border-t bg-gray-50 space-y-2 sm:space-y-3 z-10">
                        {/* Promoção Frutuba */}
                        {cartTotal < PROMO_MIN_VALUE ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                <p className="text-sm font-bold text-blue-800 mb-1">
                                    🎁 Falta R$ {(PROMO_MIN_VALUE - cartTotal).toFixed(2)} para ganhar um {PROMO_PRIZE} grátis!
                                </p>
                                <p className="text-xs text-blue-600">
                                    Nas compras a partir de R$ {PROMO_MIN_VALUE.toFixed(2)}, você ganha um {PROMO_PRIZE}!
                                </p>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center animate-pulse">
                                <p className="text-sm font-bold text-green-800 mb-1">
                                    🎉 Parabéns! Você ganhou um {PROMO_PRIZE} grátis!
                                </p>
                                <p className="text-xs text-green-600">
                                    Ele será incluído automaticamente no seu pedido!
                                </p>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center text-base sm:text-lg font-bold text-gray-800">
                            <span>Total</span>
                            <span>R$ {cartTotal.toFixed(2)}</span>
                        </div>
                        <button 
                            className="w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                            style={{ backgroundColor: storeConfig.secondaryColor }}
                            onClick={finalizeOrder}
                        >
                            <span className="material-icons-round text-xl sm:text-2xl">whatsapp</span>
                            Finalizar Pedido
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Half & Half Modal */}
      {isHalfModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                      <div>
                          <h2 className="text-xl font-bold text-gray-800">Montar Meio a Meio</h2>
                          <p className="text-sm text-orange-700 font-medium">Pizza meio a meio será cobrado a pizza de maior valor!</p>
                      </div>
                      <button onClick={() => setIsHalfModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <span className="material-icons-round">close</span>
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                          {[0, 1].map(index => (
                              <div key={index} className={`border-2 rounded-xl p-4 text-center transition-all ${halfSelections[index] ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300'}`}>
                                  <h4 className="text-sm font-bold text-gray-500 mb-2">Metade {index + 1}</h4>
                                  {halfSelections[index] ? (
                                      <div className="flex flex-col items-center">
                                          <img src={halfSelections[index]!.image} className="w-16 h-16 rounded-full object-cover mb-2" alt="" />
                                          <span className="font-bold text-gray-800 text-sm line-clamp-1">{halfSelections[index]!.name}</span>
                                          <span className="text-xs text-green-700 font-semibold">R$ {halfSelections[index]!.price.toFixed(2)}</span>
                                          <button 
                                            onClick={() => {
                                                const newSel = [...halfSelections] as [Product|null, Product|null];
                                                newSel[index] = null;
                                                setHalfSelections(newSel);
                                            }}
                                            className="mt-2 text-xs text-red-500 hover:underline"
                                          >
                                              Alterar
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="py-4 text-gray-400">
                                          <span className="material-icons-round text-3xl block mb-1">pie_chart</span>
                                          Selecione abaixo
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>

                      <h3 className="font-bold text-gray-700 mb-3">Sabores Disponíveis</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {products.filter(p => p.category === CategoryType.SALTY).map(p => {
                              const isSelected = halfSelections.some(s => s?.id === p.id);
                              return (
                                  <button
                                    key={p.id}
                                    onClick={() => {
                                        const emptyIndex = halfSelections.findIndex(s => s === null);
                                        if (emptyIndex !== -1 && !isSelected) {
                                            const newSel = [...halfSelections] as [Product|null, Product|null];
                                            newSel[emptyIndex] = p;
                                            setHalfSelections(newSel);
                                            
                                            // Se for o segundo sabor (emptyIndex === 1), rolar para a seção de complementos
                                            if (emptyIndex === 1 && complements.length > 0) {
                                                setTimeout(() => {
                                                    const complementSection = document.querySelector('#half-complement-section');
                                                    if (complementSection) {
                                                        complementSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }
                                                }, 100);
                                            }
                                        }
                                    }}
                                    disabled={isSelected || (!halfSelections.includes(null))}
                                    className={`flex items-center gap-3 p-2 rounded-lg border text-left transition-all ${
                                        isSelected 
                                        ? 'bg-gray-100 border-gray-200 opacity-50 cursor-default' 
                                        : !halfSelections.includes(null) 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : 'hover:border-green-500 hover:shadow-sm hover:bg-green-50'
                                    }`}
                                  >
                                      <img src={p.image} alt={p.name} className="w-12 h-12 rounded object-cover" />
                                      <div className="flex-1 min-w-0">
                                          <div className="text-sm font-bold text-gray-800 truncate">{p.name}</div>
                                          <div className="text-xs text-gray-500">R$ {p.price.toFixed(2)}</div>
                                      </div>
                                      {isSelected && <span className="material-icons-round text-green-600 text-sm">check_circle</span>}
                                  </button>
                              );
                          })}
                      </div>

                      {/* Seleção de Complementos (Bordas) */}
                      {complements.length > 0 && (
                          <div id="half-complement-section" className="mt-6">
                              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                  <span className="material-icons-round text-purple-600">add_circle</span>
                                  Complementos (Opcional)
                              </h3>
                              <div className="space-y-2">
                                  {complements.map(complement => {
                                      const isSelected = selectedComplementIds.includes(complement.id);
                                      
                                      return (
                                          <button
                                              key={complement.id}
                                              type="button"
                                              onClick={() => {
                                                  setSelectedComplementIds(prev => 
                                                      isSelected ? [] : [complement.id]
                                                  );
                                              }}
                                              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                                                  isSelected
                                                      ? 'border-purple-500 bg-purple-50 shadow-md'
                                                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                              }`}
                                          >
                                              <div className="flex items-center gap-3">
                                                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                                                      isSelected 
                                                          ? 'bg-purple-600 border-purple-600' 
                                                          : 'border-gray-300'
                                                  }`}>
                                                      {isSelected && (
                                                          <span className="material-icons-round text-white text-sm">check</span>
                                                      )}
                                                  </div>
                                                  <div className="text-left">
                                                      <div className="font-bold text-gray-800">{complement.name}</div>
                                                      {complement.description && (
                                                          <div className="text-xs text-gray-500">{complement.description}</div>
                                                      )}
                                                  </div>
                                              </div>
                                              <div className="font-bold text-purple-700">
                                                  {complement.price === 0 ? 'Grátis' : `+ R$ ${complement.price.toFixed(2)}`}
                                              </div>
                                          </button>
                                      );
                                  })}
                              </div>
                              
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-sm text-blue-800">
                                      <span className="material-icons-round text-sm align-middle">info</span>
                                      <span className="ml-1">Você pode escolher <strong>apenas 1 tipo de borda</strong> por pizza.</span>
                                  </p>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-4 bg-white border-t flex justify-end gap-3">
                      <button 
                        onClick={() => setIsHalfModalOpen(false)}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={addHalfHalfToCart}
                        disabled={halfSelections.some(s => s === null)}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 disabled:opacity-50 disabled:shadow-none"
                      >
                          Adicionar Pizza - R$ {(() => {
                              const basePrice = Math.max(
                                  halfSelections[0]?.price || 0, 
                                  halfSelections[1]?.price || 0
                              );
                              const complementsTotal = complements
                                  .filter(c => selectedComplementIds.includes(c.id))
                                  .reduce((sum, c) => sum + c.price, 0);
                              return (basePrice + complementsTotal).toFixed(2);
                          })()}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Pizza Selector Modal (Tamanho + Complementos) */}
      {showPizzaSelector && selectedPizza && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <img src={selectedPizza.image} className="w-16 h-16 rounded-full object-cover shadow-md" alt={selectedPizza.name} />
                          <div>
                              <h2 className="text-xl font-bold text-gray-800">{selectedPizza.name}</h2>
                              <p className="text-sm text-gray-600">{selectedPizza.description}</p>
                          </div>
                      </div>
                      <button onClick={() => setShowPizzaSelector(false)} className="text-gray-400 hover:text-gray-600">
                          <span className="material-icons-round">close</span>
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* Seleção de Tamanho */}
                      <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                              <span className="material-icons-round text-orange-600">straighten</span>
                              Escolha o Tamanho
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                              <button
                                  type="button"
                                  onClick={() => setSelectedSize('grande')}
                                  className={`p-4 rounded-xl border-2 transition-all ${
                                      selectedSize === 'grande' 
                                          ? 'border-green-500 bg-green-50 shadow-md' 
                                          : 'border-gray-200 hover:border-gray-300'
                                  }`}
                              >
                                  <div className="flex items-center justify-between">
                                      <div className="text-left">
                                          <div className="font-bold text-gray-800">Grande</div>
                                          <div className="text-sm text-gray-500">8 fatias</div>
                                      </div>
                                      <div className="font-bold text-green-700">
                                          R$ {selectedPizza.price.toFixed(2)}
                                      </div>
                                  </div>
                              </button>
                              
                              <button
                                  type="button"
                                  onClick={() => setSelectedSize('broto')}
                                  className={`p-4 rounded-xl border-2 transition-all ${
                                      selectedSize === 'broto' 
                                          ? 'border-green-500 bg-green-50 shadow-md' 
                                          : 'border-gray-200 hover:border-gray-300'
                                  }`}
                              >
                                  <div className="flex items-center justify-between">
                                      <div className="text-left">
                                          <div className="font-bold text-gray-800">Broto</div>
                                          <div className="text-sm text-gray-500">4 fatias</div>
                                      </div>
                                      <div className="font-bold text-green-700">
                                          R$ {(selectedPizza.priceSmall || selectedPizza.price * 0.7).toFixed(2)}
                                      </div>
                                  </div>
                              </button>
                          </div>
                      </div>

                      {/* Seleção de Complementos (Bordas) */}
                      {complements.length > 0 && (
                          <div>
                              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                  <span className="material-icons-round text-purple-600">add_circle</span>
                                  Complementos (Opcional)
                              </h3>
                              <div className="space-y-2">
                                  {complements.map(complement => {
                                      const isSelected = selectedComplementIds.includes(complement.id);
                                      
                                      return (
                                          <button
                                              key={complement.id}
                                              type="button"
                                              onClick={() => {
                                                  // Permite apenas 1 complemento: substitui o anterior ou remove se clicar no mesmo
                                                  setSelectedComplementIds(prev => 
                                                      isSelected 
                                                          ? [] // Remove se clicar no já selecionado
                                                          : [complement.id] // Substitui qualquer seleção anterior
                                                  );
                                              }}
                                              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                                                  isSelected
                                                      ? 'border-purple-500 bg-purple-50 shadow-md'
                                                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                              }`}
                                          >
                                              <div className="flex items-center gap-3">
                                                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                                                      isSelected 
                                                          ? 'bg-purple-600 border-purple-600' 
                                                          : 'border-gray-300'
                                                  }`}>
                                                      {isSelected && (
                                                          <span className="material-icons-round text-white text-sm">check</span>
                                                      )}
                                                  </div>
                                                  <div className="text-left">
                                                      <div className="font-bold text-gray-800">{complement.name}</div>
                                                      {complement.description && (
                                                          <div className="text-xs text-gray-500">{complement.description}</div>
                                                      )}
                                                  </div>
                                              </div>
                                              <div className="font-bold text-purple-700">
                                                  {complement.price === 0 ? 'Grátis' : `+ R$ ${complement.price.toFixed(2)}`}
                                              </div>
                                          </button>
                                      );
                                  })}
                              </div>
                              
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-sm text-blue-800">
                                      <span className="material-icons-round text-sm align-middle">info</span>
                                      <span className="ml-1">Você pode escolher <strong>apenas 1 tipo de borda</strong> por pizza.</span>
                                  </p>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-4 bg-white border-t flex justify-between items-center">
                      <button 
                          onClick={() => setShowPizzaSelector(false)}
                          className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={addPizzaToCart}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center gap-2"
                      >
                          <span className="material-icons-round">add_shopping_cart</span>
                          Adicionar - R$ {(() => {
                              const basePrice = selectedSize === 'grande' 
                                  ? selectedPizza.price 
                                  : (selectedPizza.priceSmall || selectedPizza.price * 0.7);
                              const complementsTotal = complements
                                  .filter(c => selectedComplementIds.includes(c.id))
                                  .reduce((sum, c) => sum + c.price, 0);
                              return (basePrice + complementsTotal).toFixed(2);
                          })()}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Auth Modal (Login/Register) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fadeIn">
                 <div className="flex justify-between items-center mb-6">
                     <div>
                         <h2 className="text-2xl font-bold text-gray-800">
                             Identificação
                         </h2>
                         <p className="text-sm text-gray-500 mt-1">Para continuar com seu pedido</p>
                     </div>
                     <button onClick={() => setShowAuthModal(null)} className="text-gray-400 hover:text-gray-600">
                         <span className="material-icons-round">close</span>
                     </button>
                 </div>

                 <form onSubmit={showAuthModal === 'login' ? handleLogin : handleRegister} className="space-y-5">
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                             <span className="material-icons-round text-green-600 text-lg">person</span>
                             Nome Completo
                         </label>
                         <input 
                             required
                             type="text"
                             className="w-full p-3 sm:p-4 border-2 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all text-base"
                             placeholder="Ex: Flavio Silva"
                             value={authForm.name}
                             onChange={e => setAuthForm({...authForm, name: e.target.value})}
                         />
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                             <span className="material-icons-round text-green-600 text-lg">phone</span>
                             Telefone (WhatsApp)
                         </label>
                         <input 
                             required
                             type="tel"
                             className="w-full p-3 sm:p-4 border-2 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all text-base"
                             placeholder="Ex: 13 99651-1793"
                             value={authForm.phone}
                             onChange={e => setAuthForm({...authForm, phone: e.target.value})}
                         />
                         <p className="text-xs text-gray-500 mt-1 ml-1">Usaremos para enviar atualizações do pedido</p>
                     </div>

                     <button 
                         type="submit"
                         className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all mt-6 flex items-center justify-center gap-2"
                     >
                         <span className="material-icons-round">check_circle</span>
                         {showAuthModal === 'login' ? 'Continuar' : 'Cadastrar e Continuar'}
                     </button>
                 </form>

                 <div className="mt-6 text-center text-sm text-gray-600">
                     {showAuthModal === 'login' ? (
                         <p>
                             Primeira vez aqui?{' '}
                             <button onClick={() => setShowAuthModal('register')} className="text-green-600 font-bold hover:underline">
                                 Cadastre-se
                             </button>
                         </p>
                     ) : (
                         <p>
                             Já é cliente?{' '}
                             <button onClick={() => setShowAuthModal('login')} className="text-green-600 font-bold hover:underline">
                                 Faça Login
                             </button>
                         </p>
                     )}
                 </div>

                 <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
                     <div className="flex items-start gap-3">
                         <span className="material-icons-round text-green-600 text-xl">info</span>
                         <div className="text-xs text-gray-600">
                             <p className="font-semibold text-green-700 mb-1">Seus dados estão seguros</p>
                             <p>Não compartilharemos suas informações com terceiros.</p>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && currentUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 bg-gradient-to-r from-green-600 to-green-700 text-white flex justify-between items-start">
                      <div>
                          <h2 className="text-2xl font-bold flex items-center gap-2">
                              <span className="material-icons-round">account_circle</span>
                              Minha Conta
                          </h2>
                          <p className="opacity-90 mt-1">{currentUser.name}</p>
                      </div>
                      <button onClick={() => setShowProfile(false)} className="text-white/70 hover:text-white">
                          <span className="material-icons-round text-2xl">close</span>
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                      <section className="mb-8">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Meus Dados</h3>
                          <div className="grid grid-cols-1 gap-4 text-sm">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                  <span className="text-gray-500 block mb-1">Telefone</span>
                                  <span className="font-medium">{currentUser.phone}</span>
                              </div>
                          </div>
                      </section>

                      <section>
                          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Histórico de Pedidos</h3>
                          {currentUser.orders.length === 0 ? (
                              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                                  <span className="material-icons-round text-4xl mb-2">receipt_long</span>
                                  <p>Você ainda não fez nenhum pedido.</p>
                              </div>
                          ) : (
                              <div className="space-y-3">
                                  {currentUser.orders.map(order => (
                                      <div key={order.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                          <div className="flex justify-between items-start mb-2">
                                              <div>
                                                  <span className="font-bold text-gray-800">Pedido #{order.id.slice(-4)}</span>
                                                  <div className="text-xs text-gray-500">
                                                      {new Date(order.date).toLocaleDateString()} às {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                  </div>
                                              </div>
                                              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                                  {order.status}
                                              </span>
                                          </div>
                                          <ul className="text-sm text-gray-600 mb-3 space-y-1">
                                              {order.items.map((item, idx) => (
                                                  <li key={idx} className="flex justify-between">
                                                      <span>{item.quantity}x {item.name}</span>
                                                      <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                                  </li>
                                              ))}
                                          </ul>
                                          <div className="border-t pt-2 flex justify-between font-bold text-gray-800">
                                              <span>Total</span>
                                              <span>R$ {order.total.toFixed(2)}</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </section>
                  </div>

                  <div className="p-4 bg-gray-50 border-t flex justify-end">
                      <button 
                          onClick={handleLogout}
                          className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                      >
                          <span className="material-icons-round">logout</span>
                          Sair da Conta
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Delivery/Pickup Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-fadeIn max-h-[90vh] overflow-y-auto">
                 <div className="flex justify-between items-center mb-6">
                     <div>
                         <h2 className="text-2xl font-bold text-gray-800">Finalizar Pedido</h2>
                         <p className="text-sm text-gray-500 mt-1">Escolha como deseja receber</p>
                     </div>
                     <button onClick={() => {
                         setShowDeliveryModal(false);
                         setDeliveryType(null);
                         setIsCartOpen(true);
                     }} className="text-gray-400 hover:text-gray-600">
                         <span className="material-icons-round">close</span>
                     </button>
                 </div>

                 {!deliveryType ? (
                     <div className="space-y-4">
                         <button
                             onClick={() => setDeliveryType('delivery')}
                             className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all flex items-start gap-4 group"
                         >
                             <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-500 transition-colors">
                                 <span className="material-icons-round text-green-600 group-hover:text-white text-2xl">delivery_dining</span>
                             </div>
                             <div className="text-left flex-1">
                                 <h3 className="text-lg font-bold text-gray-800 mb-1">Entrega em Domicílio</h3>
                                 <p className="text-sm text-gray-600">Receba seu pedido no conforto da sua casa</p>
                                 <p className="text-xs text-gray-500 mt-2">Taxa de entrega pode ser aplicada</p>
                             </div>
                             <span className="material-icons-round text-gray-400 group-hover:text-green-500">chevron_right</span>
                         </button>

                         <button
                             onClick={() => setDeliveryType('pickup')}
                             className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all flex items-start gap-4 group"
                         >
                             <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                                 <span className="material-icons-round text-orange-600 group-hover:text-white text-2xl">storefront</span>
                             </div>
                             <div className="text-left flex-1">
                                 <h3 className="text-lg font-bold text-gray-800 mb-1">Retirar no Local</h3>
                                 <p className="text-sm text-gray-600">Retire seu pedido na pizzaria</p>
                                 <p className="text-xs text-green-600 mt-2 font-medium">⏱️ Pronto em 30 minutos</p>
                             </div>
                             <span className="material-icons-round text-gray-400 group-hover:text-green-500">chevron_right</span>
                         </button>
                     </div>
                 ) : deliveryType === 'delivery' ? (
                     <div className="space-y-4">
                         <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                             <div className="flex items-start gap-3">
                                 <span className="material-icons-round text-blue-600">info</span>
                                 <div className="text-sm text-blue-800">
                                     <p className="font-semibold mb-1">Preencha seu endereço de entrega</p>
                                     <p className="text-xs">Todos os campos são obrigatórios para garantir a entrega correta</p>
                                 </div>
                             </div>
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="sm:col-span-2">
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Rua/Avenida *</label>
                                 <input 
                                     required
                                     type="text"
                                     className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
                                     placeholder="Nome da rua"
                                     value={deliveryAddress.street}
                                     onChange={e => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                                 />
                             </div>

                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Número *</label>
                                 <input 
                                     required
                                     type="text"
                                     className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
                                     placeholder="123"
                                     value={deliveryAddress.number}
                                     onChange={e => setDeliveryAddress({...deliveryAddress, number: e.target.value})}
                                 />
                             </div>

                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Bairro *</label>
                                 <input 
                                     required
                                     type="text"
                                     className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
                                     placeholder="Nome do bairro"
                                     value={deliveryAddress.neighborhood}
                                     onChange={e => setDeliveryAddress({...deliveryAddress, neighborhood: e.target.value})}
                                 />
                             </div>

                             <div className="sm:col-span-2">
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                                 <input 
                                     type="text"
                                     className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
                                     placeholder="Apto, Bloco, etc (opcional)"
                                     value={deliveryAddress.complement}
                                     onChange={e => setDeliveryAddress({...deliveryAddress, complement: e.target.value})}
                                 />
                             </div>

                             <div className="sm:col-span-2">
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Ponto de Referência</label>
                                 <input 
                                     type="text"
                                     className="w-full p-3 border-2 rounded-xl bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all"
                                     placeholder="Ex: Próximo ao supermercado (opcional)"
                                     value={deliveryAddress.reference}
                                     onChange={e => setDeliveryAddress({...deliveryAddress, reference: e.target.value})}
                                 />
                             </div>
                         </div>

                         {/* Forma de Pagamento */}
                         <div className="border-t pt-6 mt-6">
                             <h3 className="text-lg font-bold text-gray-800 mb-4">💳 Forma de Pagamento</h3>
                             <div className="grid grid-cols-2 gap-3 mb-4">
                                 <button
                                     onClick={() => setPaymentMethod('dinheiro')}
                                     className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 ${
                                         paymentMethod === 'dinheiro' 
                                         ? 'border-green-500 bg-green-50 shadow-md' 
                                         : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                     }`}
                                 >
                                     <span className="text-3xl">💵</span>
                                     <span className="text-sm font-semibold">Dinheiro</span>
                                 </button>
                                 
                                 <button
                                     onClick={() => {
                                         setPaymentMethod('debito');
                                         setChangeFor('');
                                     }}
                                     className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 ${
                                         paymentMethod === 'debito' 
                                         ? 'border-green-500 bg-green-50 shadow-md' 
                                         : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                     }`}
                                 >
                                     <span className="text-3xl">💳</span>
                                     <span className="text-sm font-semibold">Débito</span>
                                 </button>
                                 
                                 <button
                                     onClick={() => {
                                         setPaymentMethod('credito');
                                         setChangeFor('');
                                     }}
                                     className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 ${
                                         paymentMethod === 'credito' 
                                         ? 'border-green-500 bg-green-50 shadow-md' 
                                         : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                     }`}
                                 >
                                     <span className="text-3xl">💳</span>
                                     <span className="text-sm font-semibold">Crédito</span>
                                 </button>
                                 
                                 <button
                                     onClick={() => {
                                         setPaymentMethod('pix');
                                         setChangeFor('');
                                     }}
                                     className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 ${
                                         paymentMethod === 'pix' 
                                         ? 'border-green-500 bg-green-50 shadow-md' 
                                         : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                     }`}
                                 >
                                     <span className="text-3xl">📱</span>
                                     <span className="text-sm font-semibold">PIX</span>
                                 </button>
                             </div>

                             {paymentMethod === 'dinheiro' && (
                                 <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                     <label className="block text-sm font-medium text-gray-700 mb-2">
                                         Precisa de troco para quanto? (Opcional)
                                     </label>
                                     <input 
                                         type="number"
                                         step="0.01"
                                         className="w-full p-3 border-2 rounded-xl bg-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none transition-all"
                                         placeholder={`Valor maior que R$ ${cartTotal.toFixed(2)}`}
                                         value={changeFor}
                                         onChange={e => setChangeFor(e.target.value)}
                                     />
                                     {changeFor && parseFloat(changeFor) > cartTotal && (
                                         <p className="text-sm text-green-600 mt-2 font-medium">
                                             Troco: R$ {(parseFloat(changeFor) - cartTotal).toFixed(2)}
                                         </p>
                                     )}
                                 </div>
                             )}
                             
                             <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
                                 <p className="text-xs text-red-700 font-medium flex items-center gap-2">
                                     <span className="material-icons-round text-sm">info</span>
                                     Não aceitamos VR e Vale Alimentação
                                 </p>
                             </div>
                         </div>

                         <div className="flex gap-3 mt-6">
                             <button
                                 onClick={() => setDeliveryType(null)}
                                 className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                             >
                                 Voltar
                             </button>
                             <button
                                 onClick={confirmOrder}
                                 className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                             >
                                 <span className="material-icons-round">check_circle</span>
                                 Confirmar Pedido
                             </button>
                         </div>
                     </div>
                 ) : (
                     <div className="space-y-4">
                         <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                             <div className="flex items-start gap-4">
                                 <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                     <span className="material-icons-round text-white text-2xl">storefront</span>
                                 </div>
                                 <div className="flex-1">
                                     <h3 className="text-lg font-bold text-gray-800 mb-2">Retirada no Local</h3>
                                     <p className="text-sm text-gray-600 mb-3">Seu pedido será preparado e ficará disponível para retirada em aproximadamente:</p>
                                     <div className="bg-white p-4 rounded-lg border border-green-200">
                                         <p className="text-3xl font-bold text-green-600 text-center">30 minutos</p>
                                     </div>
                                 </div>
                             </div>
                         </div>

                         <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                             <div className="flex items-start gap-3">
                                 <span className="material-icons-round text-blue-600">location_on</span>
                                 <div className="text-sm text-blue-800">
                                     <p className="font-semibold mb-1">Endereço da Pizzaria:</p>
                                     <p>{storeConfig.name}</p>
                                     <p className="text-xs mt-2">Ao confirmar, enviaremos os detalhes via WhatsApp</p>
                                 </div>
                             </div>
                         </div>

                         {/* Forma de Pagamento - Retirada */}
                         <div className="border-t pt-6 mt-6">
                             <h3 className="text-lg font-bold text-gray-800 mb-4">💳 Forma de Pagamento</h3>
                             <div className="grid grid-cols-2 gap-3 mb-4">
                                 <button
                                     onClick={() => setPaymentMethod('dinheiro')}
                                     className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 ${
                                         paymentMethod === 'dinheiro' 
                                         ? 'border-green-500 bg-green-50 shadow-md' 
                                         : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                     }`}
                                 >
                                     <span className="text-3xl">💵</span>
                                     <span className="text-sm font-semibold">Dinheiro</span>
                                 </button>
                                 
                                 <button
                                     onClick={() => {
                                         setPaymentMethod('debito');
                                         setChangeFor('');
                                     }}
                                     className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 ${
                                         paymentMethod === 'debito' 
                                         ? 'border-green-500 bg-green-50 shadow-md' 
                                         : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                     }`}
                                 >
                                     <span className="text-3xl">💳</span>
                                     <span className="text-sm font-semibold">Débito</span>
                                 </button>
                                 
                                 <button
                                     onClick={() => {
                                         setPaymentMethod('credito');
                                         setChangeFor('');
                                     }}
                                     className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 ${
                                         paymentMethod === 'credito' 
                                         ? 'border-green-500 bg-green-50 shadow-md' 
                                         : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                     }`}
                                 >
                                     <span className="text-3xl">💳</span>
                                     <span className="text-sm font-semibold">Crédito</span>
                                 </button>
                                 
                                 <button
                                     onClick={() => {
                                         setPaymentMethod('pix');
                                         setChangeFor('');
                                     }}
                                     className={`p-4 border-2 rounded-xl transition-all flex flex-col items-center gap-2 ${
                                         paymentMethod === 'pix' 
                                         ? 'border-green-500 bg-green-50 shadow-md' 
                                         : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                     }`}
                                 >
                                     <span className="text-3xl">📱</span>
                                     <span className="text-sm font-semibold">PIX</span>
                                 </button>
                             </div>

                             {paymentMethod === 'dinheiro' && (
                                 <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                     <label className="block text-sm font-medium text-gray-700 mb-2">
                                         Precisa de troco para quanto? (Opcional)
                                     </label>
                                     <input 
                                         type="number"
                                         step="0.01"
                                         className="w-full p-3 border-2 rounded-xl bg-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 focus:outline-none transition-all"
                                         placeholder={`Valor maior que R$ ${cartTotal.toFixed(2)}`}
                                         value={changeFor}
                                         onChange={e => setChangeFor(e.target.value)}
                                     />
                                     {changeFor && parseFloat(changeFor) > cartTotal && (
                                         <p className="text-sm text-green-600 mt-2 font-medium">
                                             Troco: R$ {(parseFloat(changeFor) - cartTotal).toFixed(2)}
                                         </p>
                                     )}
                                 </div>
                             )}
                             
                             <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
                                 <p className="text-xs text-red-700 font-medium flex items-center gap-2">
                                     <span className="material-icons-round text-sm">info</span>
                                     Não aceitamos VR e Vale Alimentação
                                 </p>
                             </div>
                         </div>

                         <div className="flex gap-3 mt-6">
                             <button
                                 onClick={() => setDeliveryType(null)}
                                 className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                             >
                                 Voltar
                             </button>
                             <button
                                 onClick={confirmOrder}
                                 className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                             >
                                 <span className="material-icons-round">check_circle</span>
                                 Confirmar Pedido
                             </button>
                         </div>
                     </div>
                 )}
             </div>
        </div>
      )}
    </div>
  );
};

export default App;