const whatsappService = require('./whatsappService');

// Simulação de um banco de dados de pedidos e caixa
const ordersDB = [];
const cashMovementsDB = [];

/**
 * Processa um novo pedido recebido do site.
 * @param {object} io - Instância do Socket.IO para notificação em tempo real.
 * @param {object} orderData - Dados do pedido vindo do frontend.
 * @returns {object} O pedido criado.
 */
function processNewOrder(io, orderData) {
  console.log('📦 Recebendo novo pedido do site:', orderData.id);

  // Garante que deliveryAddress seja um objeto se for delivery,
  // mesmo que o frontend do site envie como string.
  let formattedDeliveryAddress = undefined;
  if (orderData.deliveryType === 'delivery' && orderData.deliveryAddress) {
    formattedDeliveryAddress = {
      full: orderData.deliveryAddress,
      complement: orderData.addressComplement || '', // Garante que seja string vazia se não houver
      reference: orderData.addressReference || ''    // Garante que seja string vazia se não houver
    };
  }

  // 1. Define o status inicial e data de criação
  const newOrder = {
    ...orderData,
    status: 'Em Produção', // Status inicial automático
    createdAt: new Date().toISOString(),
    deliveryAddress: formattedDeliveryAddress, // Usa o endereço formatado
  };

  // 2. Salva o pedido no "banco de dados"
  ordersDB.push(newOrder);
  console.log(`💾 Pedido ${newOrder.id} salvo com status "Em Produção".`);
  // 3. Registra a movimentação no caixa
  const cashMovement = {
    id: `cash-${Date.now()}`,
    type: 'Venda Online', // Tipo da movimentação
    orderId: newOrder.id,
    amount: newOrder.total,
    date: new Date().toISOString(),
  };
  cashMovementsDB.push(cashMovement);
  console.log(`💰 Movimentação de caixa registrada: R$ ${cashMovement.amount.toFixed(2)}`);

  // 4. Notifica o painel ADM/PDV em tempo real
  io.emit('novo_pedido', newOrder);
  console.log(`📢 Notificando painel ADM sobre o novo pedido.`);

  // 5. Dispara a notificação do WhatsApp para o cliente
  try {
    whatsappService.sendProductionMessage(newOrder);
  } catch (error) {
    console.error('❌ Erro ao enviar notificação do WhatsApp:', error.message);
  }

  return newOrder;
}

/**
 * Atualiza o status de um pedido e notifica o cliente.
 * @param {object} io - Instância do Socket.IO.
 * @param {string} orderId - ID do pedido a ser atualizado.
 * @param {string} newStatus - Novo status do pedido.
 */
function updateOrderStatus(io, orderId, newStatus) {
  console.log(`🔄 Atualizando status do pedido ${orderId} para "${newStatus}"`);

  // 1. Encontra o pedido no nosso "banco de dados"
  const orderIndex = ordersDB.findIndex(o => o.id === orderId);

  if (orderIndex === -1) {
    console.error(`❌ Pedido ${orderId} não encontrado para atualização.`);
    return null;
  }

  // 2. Atualiza o status do pedido
  const order = ordersDB[orderIndex];
  order.status = newStatus;
  ordersDB[orderIndex] = order;
  console.log(`💾 Pedido ${orderId} atualizado para "${newStatus}".`);

  // 3. Dispara a notificação de "Pedido Pronto" para o cliente
  whatsappService.sendReadyMessage(order);

  // 4. Notifica todos os painéis conectados sobre a mudança de status
  io.emit('status_atualizado', { orderId, newStatus });
  console.log(`📢 Notificando painéis sobre a atualização do pedido ${orderId}.`);

  return order;
}

module.exports = { processNewOrder, updateOrderStatus };