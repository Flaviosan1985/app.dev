import { useState, useEffect } from 'react';
import { CashRegister } from '../types';

export default function CashHistory() {
  const [cashHistory, setCashHistory] = useState<CashRegister[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCashHistory();
  }, []);

  const loadCashHistory = async () => {
    try {
      const history = await window.electronAPI.cashRegister.getAll();
      setCashHistory(history);
    } catch (error) {
      console.error('Erro ao carregar histórico de caixa:', error);
    }
  };

  const filteredCashHistory = cashHistory.filter(cash => {
    const matchesStatus = filterStatus === 'all' || cash.status === filterStatus;
    const matchesSearch = cash.openedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cash.closedBy && cash.closedBy.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const calculateCashTotal = (cash: CashRegister) => {
    const salesTotal = cash.transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.amount, 0);
    const withdrawalsTotal = cash.transactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);
    const depositsTotal = cash.transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return cash.initialAmount + salesTotal - withdrawalsTotal + depositsTotal;
  };

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="material-icons-round text-red-600">history</span>
          Histórico de Caixas
        </h2>
        <button
          onClick={loadCashHistory}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <span className="material-icons-round">refresh</span>
          Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Busca por Operador */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Buscar por Operador
            </label>
            <div className="relative">
              <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome do operador..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filtro por Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status do Caixa
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('open')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  filterStatus === 'open'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Abertos
              </button>
              <button
                onClick={() => setFilterStatus('closed')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  filterStatus === 'closed'
                    ? 'bg-gray-600 text-white shadow-lg'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Fechados
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300">
          <div className="flex items-center justify-between">
            <span className="material-icons-round text-blue-600 text-3xl">event_note</span>
            <div className="text-right">
              <p className="text-sm text-gray-600 font-semibold">Total de Sessões</p>
              <p className="text-2xl font-black text-blue-600">{filteredCashHistory.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300">
          <div className="flex items-center justify-between">
            <span className="material-icons-round text-green-600 text-3xl">lock_open</span>
            <div className="text-right">
              <p className="text-sm text-gray-600 font-semibold">Caixas Abertos</p>
              <p className="text-2xl font-black text-green-600">
                {filteredCashHistory.filter(c => c.status === 'open').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border-2 border-gray-300">
          <div className="flex items-center justify-between">
            <span className="material-icons-round text-gray-600 text-3xl">lock</span>
            <div className="text-right">
              <p className="text-sm text-gray-600 font-semibold">Caixas Fechados</p>
              <p className="text-2xl font-black text-gray-600">
                {filteredCashHistory.filter(c => c.status === 'closed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Caixas */}
      {filteredCashHistory.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <span className="material-icons-round text-6xl text-gray-400 mb-4">search_off</span>
          <p className="text-xl text-gray-600 mb-2">Nenhum caixa encontrado</p>
          <p className="text-sm text-gray-500">Tente ajustar os filtros de busca</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCashHistory.slice().reverse().map((cash) => (
            <div 
              key={cash.id} 
              className={`border-2 rounded-lg p-5 hover:shadow-lg transition-all ${
                cash.status === 'open' 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`material-icons-round text-3xl ${
                      cash.status === 'open' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {cash.status === 'open' ? 'lock_open' : 'lock'}
                    </span>
                    <div>
                      <h4 className="font-bold text-lg">Caixa #{cash.id}</h4>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        cash.status === 'open' 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {cash.status === 'open' ? 'ABERTO' : 'FECHADO'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Aberto por:</p>
                      <p className="text-base font-bold text-gray-800">{cash.openedBy}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(cash.openedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    
                    {cash.closedAt && (
                      <div>
                        <p className="text-sm text-gray-600 font-semibold">Fechado por:</p>
                        <p className="text-base font-bold text-gray-800">{cash.closedBy}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(cash.closedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Estatísticas do Caixa */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Inicial</p>
                      <p className="text-base font-bold text-blue-600">
                        R$ {cash.initialAmount.toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Vendas</p>
                      <p className="text-base font-bold text-green-600">
                        R$ {cash.transactions
                          .filter(t => t.type === 'sale')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Sangrias</p>
                      <p className="text-base font-bold text-red-600">
                        R$ {cash.transactions
                          .filter(t => t.type === 'withdrawal')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Entradas</p>
                      <p className="text-base font-bold text-blue-600">
                        R$ {cash.transactions
                          .filter(t => t.type === 'deposit')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">
                        {cash.status === 'open' ? 'Esperado' : 'Final'}
                      </p>
                      <p className="text-base font-bold text-purple-600">
                        R$ {cash.status === 'open' 
                          ? calculateCashTotal(cash).toFixed(2)
                          : (cash.finalAmount?.toFixed(2) || '0.00')}
                      </p>
                    </div>
                  </div>

                  {/* Diferença (apenas para caixas fechados) */}
                  {cash.status === 'closed' && cash.difference !== undefined && cash.difference !== 0 && (
                    <div className={`mt-3 p-3 rounded-lg ${
                      cash.difference > 0 
                        ? 'bg-green-100 border border-green-300' 
                        : 'bg-red-100 border border-red-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">
                          {cash.difference > 0 ? '💰 Sobra' : '⚠️ Falta'}
                        </span>
                        <span className={`text-lg font-bold ${
                          cash.difference > 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {cash.difference > 0 ? '+' : ''} R$ {cash.difference.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
