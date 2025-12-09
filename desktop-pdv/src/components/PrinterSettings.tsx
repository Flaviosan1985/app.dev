/**
 * ═══════════════════════════════════════════════════════════════
 * ⚙️ CONFIGURAÇÕES DE IMPRESSORA - PIZZARIA ZATTERA
 * ═══════════════════════════════════════════════════════════════
 * 
 * Tela de configuração da impressora térmica POS
 * Acesso via: Menu Admin → Impressora
 * 
 * @author Pizzaria Zattera
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { usePrinter } from '../hooks/usePrinter';

export default function PrinterSettings() {
  const {
    config,
    updateConfig,
    isServerOnline,
    isPrinting,
    availablePrinters,
    lastError,
    checkServer,
    refreshPrinters,
    printTest
  } = usePrinter();

  const [testResult, setTestResult] = useState<string | null>(null);

  // Carregar impressoras ao montar
  useEffect(() => {
    if (isServerOnline) {
      refreshPrinters();
    }
  }, [isServerOnline, refreshPrinters]);

  // ═══════════════════════════════════════════════════════════════
  // 🧪 TESTE DE IMPRESSÃO
  // ═══════════════════════════════════════════════════════════════

  const handleTestPrint = async () => {
    setTestResult(null);
    const success = await printTest();
    
    if (success) {
      setTestResult('✅ Teste de impressão concluído com sucesso!');
    } else {
      setTestResult('❌ Erro no teste de impressão. Verifique as configurações.');
    }

    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════ */}
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="material-icons-round text-4xl text-green-400">print</span>
            Configurações de Impressora
          </h1>
          <p className="text-gray-400 mt-2">Configure sua impressora térmica POS para cupons automáticos</p>
        </div>

        {/* Status do Servidor */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isServerOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-300">
            {isServerOnline ? 'Servidor Online' : 'Servidor Offline'}
          </span>
          <button
            onClick={checkServer}
            className="ml-2 text-gray-400 hover:text-white transition-colors"
            title="Verificar servidor"
          >
            <span className="material-icons-round text-lg">refresh</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ALERTA - SERVIDOR OFFLINE
      ═══════════════════════════════════════════════════════════════ */}

      {!isServerOnline && (
        <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="material-icons-round text-red-400 text-2xl">error</span>
            <div className="flex-1">
              <h3 className="text-red-300 font-bold mb-2">Servidor de Impressão Offline</h3>
              <p className="text-red-200 text-sm mb-3">
                O servidor Node.js de impressão não está respondendo. Inicie o servidor para usar a impressora.
              </p>
              <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-gray-300">
                <p>cd desktop-pdv/print-server</p>
                <p>npm install</p>
                <p>npm start</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          CONFIGURAÇÕES GERAIS
      ═══════════════════════════════════════════════════════════════ */}

      <div className="bg-gray-800 rounded-xl p-6 mb-6 shadow-lg border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-icons-round text-green-400">settings</span>
          Configurações Gerais
        </h2>

        <div className="space-y-4">
          {/* Habilitar Impressão */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-semibold">Habilitar Impressão</label>
              <p className="text-sm text-gray-400">Ativar impressão automática de cupons</p>
            </div>
            <button
              onClick={() => updateConfig({ enabled: !config.enabled })}
              className={`relative w-16 h-8 rounded-full transition-colors ${
                config.enabled ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                  config.enabled ? 'transform translate-x-8' : ''
                }`}
              />
            </button>
          </div>

          {/* Impressão Automática */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-semibold">Impressão Automática</label>
              <p className="text-sm text-gray-400">Imprimir automaticamente ao finalizar venda</p>
            </div>
            <button
              onClick={() => updateConfig({ autoPrint: !config.autoPrint })}
              disabled={!config.enabled}
              className={`relative w-16 h-8 rounded-full transition-colors ${
                config.autoPrint && config.enabled ? 'bg-green-600' : 'bg-gray-600'
              } disabled:opacity-50`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                  config.autoPrint ? 'transform translate-x-8' : ''
                }`}
              />
            </button>
          </div>

          {/* Número de Cópias */}
          <div>
            <label className="text-white font-semibold block mb-2">Número de Cópias</label>
            <input
              type="number"
              min="1"
              max="5"
              value={config.printCopies}
              onChange={(e) => updateConfig({ printCopies: parseInt(e.target.value) || 1 })}
              disabled={!config.enabled}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CONFIGURAÇÕES DA IMPRESSORA
      ═══════════════════════════════════════════════════════════════ */}

      <div className="bg-gray-800 rounded-xl p-6 mb-6 shadow-lg border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="material-icons-round text-blue-400">devices</span>
          Configurações da Impressora
        </h2>

        <div className="space-y-4">
          {/* Tipo de Conexão */}
          <div>
            <label className="text-white font-semibold block mb-2">Tipo de Conexão</label>
            <select
              value={config.printerType}
              onChange={(e) => updateConfig({ printerType: e.target.value as any })}
              disabled={!config.enabled}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
            >
              <option value="usb">USB</option>
              <option value="network">Rede (IP)</option>
              <option value="serial">Serial (COM)</option>
            </select>
          </div>

          {/* Configurações de Rede */}
          {config.printerType === 'network' && (
            <>
              <div>
                <label className="text-white font-semibold block mb-2">Endereço IP</label>
                <input
                  type="text"
                  value={config.printerIP || ''}
                  onChange={(e) => updateConfig({ printerIP: e.target.value })}
                  placeholder="192.168.1.100"
                  disabled={!config.enabled}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-white font-semibold block mb-2">Porta</label>
                <input
                  type="number"
                  value={config.printerPort || 9100}
                  onChange={(e) => updateConfig({ printerPort: parseInt(e.target.value) || 9100 })}
                  disabled={!config.enabled}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                />
              </div>
            </>
          )}

          {/* Largura do Papel */}
          <div>
            <label className="text-white font-semibold block mb-2">Largura do Papel</label>
            <select
              value={config.paperWidth}
              onChange={(e) => updateConfig({ paperWidth: parseInt(e.target.value) as any })}
              disabled={!config.enabled}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
            >
              <option value="58">58mm (Pequena)</option>
              <option value="80">80mm (Padrão)</option>
            </select>
          </div>

          {/* Conjunto de Caracteres */}
          <div>
            <label className="text-white font-semibold block mb-2">Conjunto de Caracteres</label>
            <select
              value={config.characterSet}
              onChange={(e) => updateConfig({ characterSet: e.target.value as any })}
              disabled={!config.enabled}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
            >
              <option value="CP860">CP860 (Português)</option>
              <option value="CP850">CP850 (Multilíngue)</option>
              <option value="CP437">CP437 (US)</option>
            </select>
          </div>

          {/* URL do Servidor */}
          <div>
            <label className="text-white font-semibold block mb-2">URL do Servidor de Impressão</label>
            <input
              type="text"
              value={config.serverUrl}
              onChange={(e) => updateConfig({ serverUrl: e.target.value })}
              disabled={!config.enabled}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          IMPRESSORAS DISPONÍVEIS
      ═══════════════════════════════════════════════════════════════ */}

      {isServerOnline && availablePrinters.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-icons-round text-purple-400">list</span>
            Impressoras Disponíveis
          </h2>

          <div className="space-y-2">
            {availablePrinters.map((printer, index) => (
              <div
                key={index}
                className="bg-gray-700 rounded-lg p-3 flex items-center gap-3"
              >
                <span className="material-icons-round text-green-400">print</span>
                <span className="text-white">{printer}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          BOTÕES DE AÇÃO
      ═══════════════════════════════════════════════════════════════ */}

      <div className="flex gap-4">
        <button
          onClick={handleTestPrint}
          disabled={!config.enabled || !isServerOnline || isPrinting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
        >
          {isPrinting ? (
            <>
              <span className="material-icons-round animate-spin">sync</span>
              Imprimindo...
            </>
          ) : (
            <>
              <span className="material-icons-round">print</span>
              Imprimir Teste
            </>
          )}
        </button>

        <button
          onClick={refreshPrinters}
          disabled={!isServerOnline}
          className="px-6 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
        >
          <span className="material-icons-round">refresh</span>
          Atualizar
        </button>
      </div>

      {/* Resultado do Teste */}
      {testResult && (
        <div className={`mt-4 p-4 rounded-lg ${
          testResult.includes('✅') ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'
        }`}>
          <p className={testResult.includes('✅') ? 'text-green-300' : 'text-red-300'}>
            {testResult}
          </p>
        </div>
      )}

      {/* Erro */}
      {lastError && (
        <div className="mt-4 bg-red-900/30 border border-red-500 rounded-lg p-4">
          <p className="text-red-300">{lastError}</p>
        </div>
      )}
    </div>
  );
}
