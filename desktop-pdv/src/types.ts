export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  priceSmall?: number;
  category: string;
  image: string;
  isActive: boolean;
  isFeatured: boolean;
  stock: number;
  preparationTime: number;
  type?: 'product' | 'complement';
}

export interface PizzaFlavor {
  product: Product;
  fraction: 1 | 0.5 | 0.33; // inteira, meio, 1/3
}

export interface CartItemPizza {
  id: string;
  type: 'inteira' | 'meio-a-meio' | '1/3';
  size: 'grande' | 'broto';
  flavors: PizzaFlavor[];
  price: number;
  quantity: number;
  observation?: string;
  complements?: Product[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    product: Product | CartItemPizza; // Mantém a tipagem original
    quantity: number;
  }>;
  total: number;
  status: 'Em Produção' | 'Pendente' | 'Preparando' | 'Pronto' | 'Saiu para Entrega' | 'Entregue' | 'Concluído' | 'Cancelado';
  paymentMethod?: string;
  deliveryType?: 'delivery' | 'pickup';
  deliveryAddress?: { full: string; complement?: string; reference?: string; }; // Tipagem mais específica
  estimatedDeliveryTime?: number; // em minutos
  estimatedDeliveryDate?: string; // data/hora estimada
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    user?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  addressDetails?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    reference?: string;
  };
  orderHistory: string[];
  totalSpent: number;
  lastOrderDate?: string;
}

export interface StoreConfig {
  name: string;
  phone: string;
  address: string;
  openTime: string;
  closeTime: string;
  primaryColor: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'operator';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  deliveryFee: number;
  isActive: boolean;
  createdAt: string;
}

export interface CashRegister {
  id: string;
  openedBy: string;
  openedAt: string;
  closedBy?: string;
  closedAt?: string;
  initialAmount: number;
  finalAmount?: number;
  expectedAmount?: number;
  difference?: number;
  status: 'open' | 'closed';
  transactions: Array<{
    id: string;
    type: 'sale' | 'withdrawal' | 'deposit';
    amount: number;
    description: string;
    timestamp: string;
  }>;
}

// Tipagem da API do Electron
declare global {
  interface Window {
    electronAPI: {
      products: {
        getAll: () => Promise<{ data: Product[]; version: number; }>;
        create: (product: Product) => Promise<any>;
        update: (id: string, product: Product) => Promise<any>;
        delete: (id: string) => Promise<any>;
      };
      categories: {
        getAll: () => Promise<{ data: Category[]; version: number; }>;
        create: (category: Category) => Promise<any>;
        update: (id: string, category: Category) => Promise<any>;
        delete: (id: string) => Promise<any>;
      };
      orders: {
        getAll: () => Promise<Order[]>;
        create: (order: Order) => Promise<any>;
        update: (id: string, order: Partial<Order>) => Promise<any>;
        getToday: () => Promise<Order[]>;
      };
      customers: {
        getAll: () => Promise<Customer[]>;
        create: (customer: Customer) => Promise<any>;
        update: (id: string, customer: Customer) => Promise<any>;
      };
      store: {
        getConfig: () => Promise<StoreConfig>;
        updateConfig: (config: StoreConfig) => Promise<any>;
      };
      users: {
        authenticate: (username: string, password: string) => Promise<User | null>;
        getAll: () => Promise<User[]>;
        create: (user: User) => Promise<any>;
        update: (id: string, user: User) => Promise<any>;
        delete: (id: string) => Promise<any>;
      };
      data: { // Adicionado para sincronização
        onCacheInvalidated: (callback: (data: { entity: string }) => void) => void;
        getVersion: () => Promise<{ products: number; categories: number; }>;
        forceReload: () => Promise<{ products: { data: Product[]; version: number; }; categories: { data: Category[]; version: number; }; }>;
        export: () => Promise<any>;
        import: (data: any) => Promise<boolean>;
      };
      printer: {
        print: (orderData: any) => Promise<{ success: boolean; error?: string }>;
      };
      system: {
        openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
      };
      whatsapp: {
        sendMessage: (phone: string, message: string) => Promise<{ success: boolean; error?: string }>;
      };
      neighborhoods: {
        getAll: () => Promise<Neighborhood[]>;
        create: (neighborhood: Neighborhood) => Promise<any>;
        update: (id: string, neighborhood: Partial<Neighborhood>) => Promise<any>;
        delete: (id: string) => Promise<any>;
      };
      cashRegister: {
        getAll: () => Promise<CashRegister[]>;
        getCurrent: () => Promise<CashRegister | null>;
        open: (data: { openedBy: string; initialAmount: number }) => Promise<any>;
        close: (id: string, data: { closedBy: string; finalAmount: number }) => Promise<any>;
        addTransaction: (cashId: string, transaction: any) => Promise<any>;
      };
    };
  }
}
