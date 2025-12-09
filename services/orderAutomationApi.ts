// Backend: Estrutura inicial para automação de pedidos e notificações WhatsApp

import express from 'express';

const router = express.Router();

// POST /pedidos - Registro de novo pedido
router.post('/pedidos', async (req, res) => {
  try {
    const pedidoData = req.body;
    // 1. Adiciona status inicial
    pedidoData.status = 'Em Produção';

    // 2. Registrar pedido no banco (exemplo fictício)
    // Substitua por lógica real de persistência
    const novoPedido = await fakeDbInsertPedido(pedidoData);

    // 3. Emitir evento para frontend (exemplo usando WebSocket)
    if (global.io) {
      global.io.emit('novo_pedido', novoPedido);
    }

    // 4. Retornar pedido criado
    res.status(201).json(novoPedido);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar pedido.' });
  }
});

// Função fictícia para simular persistência
async function fakeDbInsertPedido(pedido) {
  // Simule um ID único
  return { id: Date.now(), ...pedido };
}

// POST /caixa/movimentacao - Registrar movimentação de caixa
router.post('/caixa/movimentacao', async (req, res) => {
  try {
    const { pedidoId, valor, tipo } = req.body;
    // Simulação de registro no banco
    const movimentacao = await fakeDbInsertMovimentacao({ pedidoId, valor, tipo, data: new Date() });
    res.status(201).json(movimentacao);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar movimentação.' });
  }
});

async function fakeDbInsertMovimentacao(mov) {
  return { id: Date.now(), ...mov };
}

// POST /notificacao/whatsapp - Disparar mensagem WhatsApp
router.post('/notificacao/whatsapp', async (req, res) => {
  try {
    const { clienteNome, status, tipoEntrega, telefone } = req.body;
    let mensagem = '';

    if (status === 'Em Produção') {
      mensagem = `Olá ${clienteNome}, seu pedido está sendo preparado! Fique de olho no seu status. Pizzeria Zattera.`;
    } else if (status === 'Pedido Pronto' && tipoEntrega === 'Delivery') {
      mensagem = `Ótima notícia! Seu pedido está pronto e a caminho. Acompanhe a entrega! Pizzeria Zattera.`;
    } else if (status === 'Pedido Pronto' && tipoEntrega === 'Retirada') {
      mensagem = `Ótima notícia! Seu pedido está pronto e aguardando sua retirada na loja! Pizzeria Zattera.`;
    }

    // Simulação de envio via API externa
    await fakeSendWhatsApp(telefone, mensagem);

    res.status(200).json({ sent: true, mensagem });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar WhatsApp.' });
  }
});

async function fakeSendWhatsApp(telefone, mensagem) {
  // Aqui integraria com Twilio/ZAPI
  return true;
}

export default router;
