import { useState, useEffect } from 'react';
import { CashRegister, User } from '../types';

interface CashManagementProps {
  currentUser: User;
  onCashChange?: () => void;
}

export default function CashManagement({ currentUser, onCashChange }: CashManagementProps) {
  const [currentCash, setCurrentCash] = useState<CashRegister | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [initialAmount, setInitialAmount] = useState('0.00');
  const [finalAmount, setFinalAmount] = useState('0.00');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalDescription, setWithdrawalDescription] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');

  useEffect(() => {
    loadCashData();
  }, []);

  const loadCashData = async () => {
    try {
      const current = await window.electronAPI.cashRegister.getCurrent();
      setCurrentCash(current);
    } catch (error) {
      console.error('Erro ao carregar dados do caixa:', error);
    }
  };

  const handleOpenCash = async () => {
    try {
      const amount = parseFloat(initialAmount);
      if (isNaN(amount) || amount < 0) {
        alert('Digite um valor inicial válido');
        return;
      }

      const result = await window.electronAPI.cashRegister.open({
        openedBy: currentUser.name,
        initialAmount: amount
      });

      if (!result || !result.success) {
        alert(result?.error || 'Erro ao abrir caixa');
        return;
      }

      setShowOpenModal(false);
      setInitialAmount('0.00');
      await loadCashData();
      if (onCashChange) onCashChange();
      alert('Caixa aberto com sucesso!');
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      alert('Erro ao abrir caixa. Verifique o console.');
    }
  };

  const handleCloseCash = async () => {
    if (!currentCash) return;

    try {
      const amount = parseFloat(finalAmount);
      if (isNaN(amount) || amount < 0) {
        alert('Digite um valor final válido');
        return;
      }

      await window.electronAPI.cashRegister.close(currentCash.id, {
        closedBy: currentUser.name,
        finalAmount: amount
      });

      setShowCloseModal(false);
      setFinalAmount('0.00');
      loadCashData();
      if (onCashChange) onCashChange();
      alert('Caixa fechado com sucesso!');
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      alert('Erro ao fechar caixa');
    }
  };

  const handleWithdrawal = async () => {
    if (!currentCash) return;

    try {
      const amount = parseFloat(withdrawalAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Digite um valor válido para sangria');
        return;
      }

      if (!withdrawalDescription.trim()) {
        alert('Descreva o motivo da sangria');
        return;
      }

      await window.electronAPI.cashRegister.addTransaction(currentCash.id, {
        id: `withdrawal-${Date.now()}`,
        type: 'withdrawal',
        amount: amount,
        description: withdrawalDescription,
        timestamp: new Date().toISOString()
      });

      setShowWithdrawalModal(false);
      setWithdrawalAmount('');
      setWithdrawalDescription('');
      await loadCashData();
      if (onCashChange) onCashChange();
      alert('Sangria registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar sangria:', error);
      alert('Erro ao registrar sangria');
    }
  };

  const handleDeposit = async () => {
    if (!currentCash) return;

    try {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Digite um valor válido para entrada');
        return;
      }

      if (!depositDescription.trim()) {
        alert('Descreva o motivo da entrada');
        return;
      }

      await window.electronAPI.cashRegister.addTransaction(currentCash.id, {
        id: `deposit-${Date.now()}`,
        type: 'deposit',
        amount: amount,
        description: depositDescription,
        timestamp: new Date().toISOString()
      });

      setShowDepositModal(false);
      setDepositAmount('');
      setDepositDescription('');
      await loadCashData();
      if (onCashChange) onCashChange();
      alert('Entrada registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar entrada:', error);
      alert('Erro ao registrar entrada');
    }
  };

  const calculateCurrentTotal = () => {
    if (!currentCash) return 0;
    
    const salesTotal = currentCash.transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.amount, 0);
    const withdrawalsTotal = currentCash.transactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);
    const depositsTotal = currentCash.transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return currentCash.initialAmount + salesTotal - withdrawalsTotal + depositsTotal;
  };

  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="material-icons-round text-red-600">payments</span>
          Gerenciar Caixa
        </h2>

        {!currentCash && currentUser.role === 'admin' && (
          <button
            onClick={() => setShowOpenModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <span className="material-icons-round">lock_open</span>
            Abrir Caixa
          </button>
        )}

        {currentCash && currentUser.role === 'admin' && (
          <button
            onClick={() => setShowCloseModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <span className="material-icons-round">lock</span>
            Fechar Caixa
          </button>
        )}
      </div>

      {/* Caixa Atual */}
      {currentCash && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-icons-round text-green-600 text-3xl">account_balance_wallet</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Caixa Aberto</h3>
              <p className="text-sm text-gray-600">Aberto por: {currentCash.openedBy}</p>
              <p className="text-xs text-gray-500">
                {new Date(currentCash.openedAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Valor Inicial</p>
              <p className="text-2xl font-bold text-blue-600">
                R$ {currentCash.initialAmount.toFixed(2)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Vendas</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {currentCash.transactions
                  .filter(t => t.type === 'sale')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Sangrias</p>
              <p className="text-2xl font-bold text-red-600">
                R$ {currentCash.transactions
                  .filter(t => t.type === 'withdrawal')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600 mb-1">Total em Caixa</p>
              <p className="text-2xl font-bold text-purple-600">
                R$ {calculateCurrentTotal().toFixed(2)}
              </p>
            </div>
          </div>

          {/* Botões de Movimentação */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowWithdrawalModal(true)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-icons-round">remove_circle</span>
              Sangria (Retirada)
            </button>
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-icons-round">add_circle</span>
              Lançar Entrada
            </button>
          </div>
        </div>
      )}

      {!currentCash && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <span className="material-icons-round text-6xl text-gray-400 mb-4">money_off</span>
          <p className="text-xl text-gray-600 mb-2">Caixa Fechado</p>
          <p className="text-sm text-gray-500">Abra o caixa para começar a operar</p>
        </div>
      )}

      {/* Modal Abrir Caixa */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="material-icons-round text-green-600">lock_open</span>
              Abrir Caixa
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Valor Inicial (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOpenModal(false);
                  setInitialAmount('0.00');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleOpenCash}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Abrir Caixa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fechar Caixa */}
      {showCloseModal && currentCash && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="material-icons-round text-red-600">lock</span>
              Fechar Caixa
            </h3>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-1">Valor Esperado</p>
              <p className="text-3xl font-bold text-purple-600">
                R$ {calculateCurrentTotal().toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Valor Final Contado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
                autoFocus
              />
            </div>

            {finalAmount && parseFloat(finalAmount) !== calculateCurrentTotal() && (
              <div className={`p-3 rounded-lg mb-4 ${
                parseFloat(finalAmount) > calculateCurrentTotal() 
                  ? 'bg-green-50 border border-green-300' 
                  : 'bg-red-50 border border-red-300'
              }`}>
                <p className="text-sm font-semibold mb-1">
                  {parseFloat(finalAmount) > calculateCurrentTotal() ? 'Sobra' : 'Falta'}
                </p>
                <p className={`text-2xl font-bold ${
                  parseFloat(finalAmount) > calculateCurrentTotal() ? 'text-green-600' : 'text-red-600'
                }`}>
                  {parseFloat(finalAmount) > calculateCurrentTotal() ? '+' : ''}
                  R$ {(parseFloat(finalAmount) - calculateCurrentTotal()).toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setFinalAmount('0.00');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseCash}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Fechar Caixa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sangria */}
      {showWithdrawalModal && currentCash && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="material-icons-round text-red-600">remove_circle</span>
              Sangria (Retirada de Caixa)
            </h3>
            
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Saldo atual em caixa:</strong> R$ {calculateCurrentTotal().toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Valor da Sangria (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motivo/Descrição *
              </label>
              <textarea
                value={withdrawalDescription}
                onChange={(e) => setWithdrawalDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Ex: Pagamento fornecedor, Troco banco, etc..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawalModal(false);
                  setWithdrawalAmount('');
                  setWithdrawalDescription('');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleWithdrawal}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Confirmar Sangria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lançar Entrada */}
      {showDepositModal && currentCash && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="material-icons-round text-blue-600">add_circle</span>
              Lançar Entrada no Caixa
            </h3>
            
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Saldo atual em caixa:</strong> R$ {calculateCurrentTotal().toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Valor da Entrada (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motivo/Descrição *
              </label>
              <textarea
                value={depositDescription}
                onChange={(e) => setDepositDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Troco para operação, Devolução, etc..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  setDepositAmount('');
                  setDepositDescription('');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeposit}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Confirmar Entrada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
