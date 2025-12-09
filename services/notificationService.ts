// Notification Sound Service
// Reproduz som quando novos pedidos chegam

export class NotificationService {
  private audioContext: AudioContext | null = null;
  private lastOrderCount: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Toca um bip de notificação
  playNotificationSound() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Configuração do som
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime); // Frequência em Hz
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime); // Volume

    // Tocar por 200ms
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  // Verifica se há novos pedidos
  checkNewOrders(currentOrderCount: number) {
    if (currentOrderCount > this.lastOrderCount) {
      this.playNotificationSound();
      
      // Notificação do navegador se permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Novo Pedido! 🍕', {
          body: `Você tem ${currentOrderCount - this.lastOrderCount} novo(s) pedido(s)`,
          icon: '/pizza-icon.png',
          badge: '/pizza-icon.png',
        });
      }
    }
    this.lastOrderCount = currentOrderCount;
  }

  // Solicita permissão para notificações
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
}

export const notificationService = new NotificationService();
