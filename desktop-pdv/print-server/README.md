# 🖨️ Servidor de Impressão - Pizzaria Zattera

Servidor Node.js local para comunicação com impressoras térmicas POS (ESC/POS).

## 📋 Requisitos

- Node.js 14 ou superior
- Impressora térmica compatível com ESC/POS
- Conexão USB, Serial ou Rede (IP)

## 🚀 Instalação

```bash
cd print-server
npm install
```

## ▶️ Execução

### Modo Produção
```bash
npm start
```

### Modo Desenvolvimento (com auto-reload)
```bash
npm run dev
```

O servidor iniciará na porta **3030** por padrão.

## 📡 Endpoints

### GET /health
Verifica se o servidor está ativo.

**Resposta:**
```json
{
  "status": "online",
  "service": "Pizzaria Zattera Print Server",
  "version": "1.0.0",
  "timestamp": "2025-12-09T..."
}
```

### GET /printers
Lista impressoras disponíveis no sistema.

**Resposta:**
```json
{
  "success": true,
  "platform": "linux",
  "printers": ["/dev/usb/lp0", "/dev/usb/lp1"]
}
```

### POST /print
Imprime conteúdo na impressora térmica.

**Body:**
```json
{
  "content": "Texto a ser impresso...",
  "copies": 1,
  "printerType": "usb",
  "printerIP": "192.168.1.100",
  "printerPort": 9100,
  "characterSet": "CP860",
  "paperWidth": 80
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "1 cópia impressa com sucesso",
  "copies": 1
}
```

### POST /test
Imprime um cupom de teste.

**Body:** (opcional)
```json
{
  "printerType": "usb",
  "paperWidth": 80
}
```

## 🔧 Configuração de Impressoras

### USB (Linux)
```javascript
printerConfig.interface = '/dev/usb/lp0';
```

### USB (Windows)
```javascript
printerConfig.interface = 'printer:USB001';
```

### USB (macOS)
```javascript
printerConfig.interface = '/dev/cu.usbserial';
```

### Rede (IP)
```javascript
printerConfig.interface = 'tcp://192.168.1.100:9100';
```

### Serial (COM)
```javascript
printerConfig.interface = 'COM3';
```

## 📄 Formatos Suportados

- **Largura:** 58mm ou 80mm
- **Charset:** CP860 (Português), CP850 (Multilíngue), CP437 (US)
- **Protocolo:** ESC/POS

## 🐛 Troubleshooting

### Impressora não conectada
- Verifique se a impressora está ligada
- Verifique se o cabo USB/Serial está conectado
- No Linux, verifique permissões: `sudo chmod 666 /dev/usb/lp0`

### Porta já em uso
Altere a porta no servidor:
```bash
PORT=3031 npm start
```

E atualize o `serverUrl` nas configurações do PDV.

### Problemas com caracteres especiais
Ajuste o `characterSet`:
- `CP860` para Português (recomendado)
- `CP850` para caracteres latinos
- `CP437` para inglês

## 📚 Dependências

- **express** - Framework web
- **cors** - Cross-Origin Resource Sharing
- **node-thermal-printer** - Driver ESC/POS

## 🔒 Segurança

Este servidor deve rodar apenas em **localhost** (127.0.0.1) para segurança.
Não exponha a porta 3030 para a internet.

## 📝 Logs

Os logs aparecem no console:
- ✅ Sucesso
- ⚠️ Avisos
- ❌ Erros

## 🆘 Suporte

Para problemas com a impressora, consulte:
- Manual da impressora
- Documentação node-thermal-printer: https://github.com/Klemen1337/node-thermal-printer

---

**Pizzaria Zattera** © 2025
