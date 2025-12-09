/**
 * ═══════════════════════════════════════════════════════════════
 * 🪝 HOOK DE IMPRESSÃO - PIZZARIA ZATTERA
 * ═══════════════════════════════════════════════════════════════
 * 
 * Hook React customizado para gerenciar impressão de cupons
 * 
 * @author Pizzaria Zattera
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  PrinterConfig,
  loadPrinterConfig,
  savePrinterConfig,
  checkPrintServer,
  listAvailablePrinters,
  printReceipt,
  printTestReceipt
} from '../services/printerService';

export function usePrinter() {
  const [config, setConfig] = useState<PrinterConfig>(loadPrinterConfig());
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // 🔄 VERIFICAR STATUS DO SERVIDOR
  // ═══════════════════════════════════════════════════════════════

  const checkServer = useCallback(async () => {
    const online = await checkPrintServer(config.serverUrl);
    setIsServerOnline(online);
    return online;
  }, [config.serverUrl]);

  // Verificar servidor ao montar e periodicamente
  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 10000); // A cada 10s
    return () => clearInterval(interval);
  }, [checkServer]);

  // ═══════════════════════════════════════════════════════════════
  // 🖨️ LISTAR IMPRESSORAS DISPONÍVEIS
  // ═══════════════════════════════════════════════════════════════

  const refreshPrinters = useCallback(async () => {
    try {
      const printers = await listAvailablePrinters(config.serverUrl);
      setAvailablePrinters(printers);
      return printers;
    } catch (error) {
      console.error('Erro ao listar impressoras:', error);
      setAvailablePrinters([]);
      return [];
    }
  }, [config.serverUrl]);

  // ═══════════════════════════════════════════════════════════════
  // 💾 ATUALIZAR CONFIGURAÇÕES
  // ═══════════════════════════════════════════════════════════════

  const updateConfig = useCallback((newConfig: Partial<PrinterConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    savePrinterConfig(updated);
  }, [config]);

  // ═══════════════════════════════════════════════════════════════
  // 🖨️ IMPRIMIR CUPOM
  // ═══════════════════════════════════════════════════════════════

  const print = useCallback(async (order: any): Promise<boolean> => {
    if (!config.enabled) {
      console.log('Impressão desabilitada');
      return false;
    }

    setIsPrinting(true);
    setLastError(null);

    try {
      await printReceipt(order, config);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao imprimir';
      setLastError(errorMessage);
      console.error('Erro ao imprimir:', errorMessage);
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [config]);

  // ═══════════════════════════════════════════════════════════════
  // 🧪 IMPRESSÃO DE TESTE
  // ═══════════════════════════════════════════════════════════════

  const printTest = useCallback(async (): Promise<boolean> => {
    setIsPrinting(true);
    setLastError(null);

    try {
      await printTestReceipt(config);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no teste';
      setLastError(errorMessage);
      console.error('Erro no teste:', errorMessage);
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [config]);

  // ═══════════════════════════════════════════════════════════════
  // 📤 RETORNO DO HOOK
  // ═══════════════════════════════════════════════════════════════

  return {
    config,
    updateConfig,
    isServerOnline,
    isPrinting,
    availablePrinters,
    lastError,
    checkServer,
    refreshPrinters,
    print,
    printTest
  };
}
