import { useState, useEffect, useMemo } from 'react';
import { Order, CashRegister } from '../types';

interface AnalyticsProps {
  orders: Order[];
  customers: any[];
}

type PeriodFilter = 'today' | 'month' | 'year' | 'custom';
type AnalyticsTab = 'kpis' | 'charts';

export default function Analytics({ orders, customers }: AnalyticsProps) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('kpis');
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);

  useEffect(() => {
    loadCashData();
  }, []);

  const loadCashData = async () => {
    try {
      const registers = await window.electronAPI.cashRegister.getAll();
      setCashRegisters(registers);
    } catch (error) {
      console.error('Erro ao carregar dados do caixa:', error);
    }
  };

  // Calcular datas do período
  const { filterStartDate, filterEndDate } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (periodFilter === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (periodFilter === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (periodFilter === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (periodFilter === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    return { filterStartDate: start, filterEndDate: end };
  }, [periodFilter, startDate, endDate]);

  // Filtrar pedidos por período
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= filterStartDate && orderDate <= filterEndDate;
    });
  }, [orders, filterStartDate, filterEndDate]);

  // KPIs
  const kpis = useMemo(() => {
    const completed = filteredOrders.filter(o => o.status !== 'Cancelado');
    const cancelled = filteredOrders.filter(o => o.status === 'Cancelado');
    
    const totalRevenue = completed.reduce((sum, order) => sum + order.total, 0);
    const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0;

    // Produtos mais vendidos
    const productCount: { [key: string]: number } = {};
    completed.forEach(order => {
      order.items.forEach(item => { // item.product é Product | CartItemPizza
        let name: string;
        if ('name' in item.product) { // É um Product normal
          name = item.product.name;
        } else { // É um CartItemPizza (pizza fracionada)
          // Para pizzas fracionadas, usamos uma descrição combinada dos sabores
          name = `Pizza (${item.product.flavors.map(f => f.product.name).join(' / ')})`;
        }
        
        productCount[name] = (productCount[name] || 0) + item.quantity;
      });
    });

    const topProducts = Object.entries(productCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Caixa no período
    const periodCashRegisters = cashRegisters.filter(cash => {
      const cashDate = new Date(cash.openedAt);
      return cashDate >= filterStartDate && cashDate <= filterEndDate;
    });

    const cashSummary = periodCashRegisters.reduce((acc, cash) => {
      const sales = cash.transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0);
      const withdrawals = cash.transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
      const deposits = cash.transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
      
      return {
        initial: acc.initial + cash.initialAmount,
        sales: acc.sales + sales,
        withdrawals: acc.withdrawals + withdrawals,
        deposits: acc.deposits + deposits,
        final: acc.final + (cash.finalAmount || 0)
      };
    }, { initial: 0, sales: 0, withdrawals: 0, deposits: 0, final: 0 });

    return {
      totalOrders: completed.length,
      totalRevenue,
      avgTicket,
      cancelledOrders: cancelled.length,
      topProducts,
      cashSummary
    };
  }, [filteredOrders, cashRegisters, filterStartDate, filterEndDate]);

  // Exportar CSV
  const exportCSV = () => {
    const headers = ['Data', 'Pedido ID', 'Cliente', 'Telefone', 'Total', 'Pagamento', 'Status'];
    const rows = filteredOrders.map(order => [
      new Date(order.createdAt).toLocaleString('pt-BR'),
      order.id,
      order.customerName,
      order.customerPhone,
      order.total.toFixed(2),
      order.paymentMethod || '-',
      order.status
    ]);

    const csvContent = '\uFEFF' + [ // BOM para UTF-8
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-vendas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    alert('✅ Relatório CSV exportado com sucesso!');
  };

  // Exportar PDF
  const exportPDF = () => {
    // Criar conteúdo HTML formatado para PDF
    const periodName = periodFilter === 'today' ? 'Hoje' :
                      periodFilter === 'month' ? 'Mês Atual' :
                      periodFilter === 'year' ? 'Ano Atual' : 'Período Personalizado';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório de Vendas - ${periodName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .kpi-card { border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb; }
          .kpi-value { font-size: 24px; font-weight: bold; color: #dc2626; }
          .kpi-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #dc2626; color: white; padding: 10px; text-align: left; }
          td { border: 1px solid #e5e7eb; padding: 8px; }
          tr:nth-child(even) { background: #f9fafb; }
          .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Pizzaria Zattera - Relatório de Vendas</h1>
        <p><strong>Período:</strong> ${periodName}</p>
        <p><strong>Data de Geração:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        
        <h2>Indicadores (KPIs)</h2>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-value">R$ ${kpis.totalRevenue.toFixed(2)}</div>
            <div class="kpi-label">Faturamento Total</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${kpis.totalOrders}</div>
            <div class="kpi-label">Pedidos Finalizados</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${kpis.cancelledOrders}</div>
            <div class="kpi-label">Pedidos Cancelados</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">R$ ${kpis.avgTicket.toFixed(2)}</div>
            <div class="kpi-label">Ticket Médio</div>
          </div>
        </div>

        <h2>Top 5 Produtos Mais Vendidos</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Produto</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            ${kpis.topProducts.map(([name, count], index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${name}</td>
                <td>${count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Detalhes dos Pedidos</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>ID</th>
              <th>Cliente</th>
              <th>Telefone</th>
              <th>Total</th>
              <th>Pagamento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.map(order => `
              <tr>
                <td>${new Date(order.createdAt).toLocaleString('pt-BR')}</td>
                <td>${order.id}</td>
                <td>${order.customerName}</td>
                <td>${order.customerPhone}</td>
                <td>R$ ${order.total.toFixed(2)}</td>
                <td>${order.paymentMethod || '-'}</td>
                <td>${order.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Pizzaria Zattera - Sistema PDV</p>
          <p>Relatório gerado automaticamente</p>
        </div>
      </body>
      </html>
    `;

    // Criar blob e download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-vendas-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    // Abrir em nova janela para impressão como PDF
    const printWindow = window.open(url);
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
    
    alert('✅ Relatório HTML/PDF gerado! Salve como PDF na janela de impressão.');
  };

  // Imprimir Relatório
  const printReport = () => {
    window.print();
  };

  return (
    <div className="h-full bg-white overflow-y-auto">
      {/* Header com Título e Filtros */}
      <div className="sticky top-0 bg-white z-10 border-b shadow-sm">
        <div className="p-6">
          <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
            <span className="material-icons-round text-red-600 text-4xl">analytics</span>
            Relatórios e Analytics
          </h2>

          {/* Filtros de Período */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="material-icons-round text-blue-600">filter_alt</span>
              Filtrar Período
            </h3>
            
            {/* Botões Rápidos */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setPeriodFilter('today')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  periodFilter === 'today'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                📅 Hoje
              </button>
              <button
                onClick={() => setPeriodFilter('month')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  periodFilter === 'month'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                📆 Mês Atual
              </button>
              <button
                onClick={() => setPeriodFilter('year')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  periodFilter === 'year'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                📊 Ano Atual
              </button>
              <button
                onClick={() => setPeriodFilter('custom')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  periodFilter === 'custom'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                🔧 Personalizado
              </button>
            </div>

            {/* Datas Customizadas */}
            {periodFilter === 'custom' && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Abas */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAnalyticsTab('kpis')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
                analyticsTab === 'kpis'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 Indicadores (KPIs)
            </button>
            <button
              onClick={() => setAnalyticsTab('charts')}
              className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
                analyticsTab === 'charts'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📈 Gráficos e Tendências
            </button>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <span className="material-icons-round">download</span>
              Exportar CSV
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              <span className="material-icons-round">picture_as_pdf</span>
              Exportar PDF
            </button>
            <button
              onClick={printReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <span className="material-icons-round">print</span>
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        {analyticsTab === 'kpis' && (
          <div className="space-y-6">
            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Vendas Totais */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-300 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="material-icons-round text-green-600 text-5xl">attach_money</span>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 font-semibold">Faturamento</p>
                    <p className="text-3xl font-black text-green-600">
                      R$ {kpis.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-green-300">
                  <p className="text-sm text-gray-600">Ticket Médio: <span className="font-bold">R$ {kpis.avgTicket.toFixed(2)}</span></p>
                </div>
              </div>

              {/* Total de Pedidos */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-300 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="material-icons-round text-blue-600 text-5xl">shopping_cart</span>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 font-semibold">Pedidos</p>
                    <p className="text-3xl font-black text-blue-600">{kpis.totalOrders}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-blue-300">
                  <p className="text-sm text-gray-600">Finalizados com sucesso</p>
                </div>
              </div>

              {/* Cancelamentos */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-300 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="material-icons-round text-red-600 text-5xl">cancel</span>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 font-semibold">Cancelados</p>
                    <p className="text-3xl font-black text-red-600">{kpis.cancelledOrders}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-red-300">
                  <p className="text-sm text-gray-600">
                    Taxa: {kpis.totalOrders > 0 ? ((kpis.cancelledOrders / (kpis.totalOrders + kpis.cancelledOrders)) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              {/* Clientes */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-300 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="material-icons-round text-purple-600 text-5xl">people</span>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 font-semibold">Clientes</p>
                    <p className="text-3xl font-black text-purple-600">{customers.length}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-purple-300">
                  <p className="text-sm text-gray-600">Base cadastrada</p>
                </div>
              </div>
            </div>

            {/* Resumo de Caixa */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-300 shadow-lg">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                <span className="material-icons-round text-yellow-600">account_balance_wallet</span>
                Resumo de Caixa no Período
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg p-4 shadow">
                  <p className="text-xs text-gray-600 mb-1">Saldo Inicial</p>
                  <p className="text-lg font-bold text-blue-600">R$ {kpis.cashSummary.initial.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <p className="text-xs text-gray-600 mb-1">Vendas</p>
                  <p className="text-lg font-bold text-green-600">R$ {kpis.cashSummary.sales.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <p className="text-xs text-gray-600 mb-1">Sangrias</p>
                  <p className="text-lg font-bold text-red-600">R$ {kpis.cashSummary.withdrawals.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <p className="text-xs text-gray-600 mb-1">Entradas</p>
                  <p className="text-lg font-bold text-blue-600">R$ {kpis.cashSummary.deposits.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <p className="text-xs text-gray-600 mb-1">Saldo Final</p>
                  <p className="text-lg font-bold text-purple-600">R$ {kpis.cashSummary.final.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Top Produtos */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                <span className="material-icons-round text-red-600">trending_up</span>
                Top 5 Produtos Mais Vendidos
              </h3>
              {kpis.topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum produto vendido no período</p>
              ) : (
                <div className="space-y-3">
                  {kpis.topProducts.map(([name, count], index) => (
                    <div key={name} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-xl ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        'bg-gradient-to-br from-blue-400 to-blue-600'
                      }`}>
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{name}</p>
                        <p className="text-sm text-gray-600">{count} unidades vendidas</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-red-600">{count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {analyticsTab === 'charts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                <span className="material-icons-round text-blue-600">bar_chart</span>
                Distribuição de Vendas por Produto
              </h3>
              {kpis.topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-12">Nenhum dado para exibir no período selecionado</p>
              ) : (
                <div className="space-y-3">
                  {kpis.topProducts.map(([name, count]) => {
                    const total = kpis.topProducts.reduce((sum, [, c]) => sum + c, 0);
                    const percentage = (count / total) * 100;
                    return (
                      <div key={name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700">{name}</span>
                          <span className="text-sm font-bold text-gray-600">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-xs font-bold text-white">{count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                <span className="material-icons-round text-indigo-600">show_chart</span>
                Evolução de Vendas no Período
              </h3>
              <div className="bg-white rounded-lg p-6">
                <p className="text-center text-gray-600 mb-4">Faturamento Total</p>
                <p className="text-center text-5xl font-black text-green-600 mb-2">
                  R$ {kpis.totalRevenue.toFixed(2)}
                </p>
                <p className="text-center text-sm text-gray-500">
                  {kpis.totalOrders} pedidos • Ticket médio: R$ {kpis.avgTicket.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
