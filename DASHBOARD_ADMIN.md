# 🎛️ Dashboard Administrativo - Pizzaria Zattera

## 📋 Visão Geral

Sistema completo de gestão com PDV integrado, controle de produtos, categorias e pedidos em tempo real.

## 🔐 Acesso ao Admin

**Método secreto**: Clique **2 vezes rapidamente** no texto de copyright no rodapé do site.

```
© 2024 Pizzaria Zattera  <-- Duplo clique aqui
```

## 🎯 Funcionalidades Principais

### 1. PDV (Ponto de Venda)
- ✅ Interface de vendas rápida
- ✅ Busca de produtos em tempo real
- ✅ Carrinho com controle de quantidade
- ✅ Múltiplas formas de pagamento
- ✅ Geração automática de pedidos
- ✅ Finalização com um clique

**Como usar:**
1. Acesse a aba "PDV"
2. Busque e clique nos produtos para adicionar
3. Ajuste quantidades no carrinho
4. Selecione forma de pagamento
5. Clique em "Finalizar Venda"

### 2. Gestão de Pedidos
- ✅ Visualização em tempo real
- ✅ Atualização de status (Pendente → Preparando → Pronto → Entregue)
- ✅ Detalhes completos de cada pedido
- ✅ Histórico de pedidos
- ✅ Filtros por status
- ✅ Sincronização automática

**Status disponíveis:**
- 🔵 Pendente - Pedido recebido
- 🟡 Preparando - Em produção
- 🟢 Pronto - Finalizado
- 🚚 Saiu para Entrega - A caminho
- ✅ Entregue - Concluído
- 🏁 Concluído - Fechado

### 3. Gestão de Produtos
- ✅ Criar, editar e excluir produtos
- ✅ Upload de fotos via celular ou desktop
- ✅ Pausar/ativar produtos
- ✅ Controle de estoque
- ✅ Tempo de preparo
- ✅ Produtos em destaque
- ✅ Organização por categorias

**Campos do produto:**
- Nome
- Descrição
- Preço
- Categoria
- Imagem (upload ou câmera)
- Estoque
- Tempo de preparo
- Status (Ativo/Pausado)
- Destaque (Sim/Não)

### 4. Gestão de Categorias
- ✅ Criar categorias personalizadas
- ✅ Escolher ícone (Material Icons)
- ✅ Definir cor
- ✅ Ordem de exibição
- ✅ Ativar/desativar categorias

**Como criar categoria:**
1. Clique em "Nova Categoria"
2. Digite o nome
3. Escolha um ícone (Ex: local_pizza, cake, local_bar)
4. Selecione uma cor
5. Defina a ordem de exibição
6. Salve

**Ícones disponíveis (Material Icons):**
- local_pizza (Pizza)
- cake (Bolo)
- local_bar (Bebida)
- restaurant (Restaurante)
- fastfood (Fast Food)
- icecream (Sorvete)
- coffee (Café)
- dinner_dining (Jantar)
- lunch_dining (Almoço)
- breakfast_dining (Café da manhã)
- e muitos outros...

### 5. Analytics (Estatísticas)
- 📊 Pedidos do dia
- 💰 Faturamento diário
- 📦 Produtos ativos
- 👥 Total de clientes
- 🏆 Produtos mais vendidos
- 📈 Gráficos e métricas

## 📸 Upload de Imagens

### Via Celular:
1. Clique em "Tirar Foto / Upload"
2. Escolha "Câmera"
3. Tire a foto do produto
4. Confirme e salve

### Via Desktop:
1. Clique em "Tirar Foto / Upload"
2. Escolha "Arquivos"
3. Selecione a imagem
4. Confirme e salve

**Formatos aceitos:** JPG, PNG, WebP
**Tamanho recomendado:** 400x400px

## 🔄 Sincronização em Tempo Real

O sistema utiliza **LocalStorage** para sincronizar dados:
- ✅ Mudanças refletem instantaneamente
- ✅ Funciona entre múltiplas abas
- ✅ Dados persistem após refresh
- ✅ Sem necessidade de backend

**Como funciona:**
1. Admin faz alteração (ex: pausa produto)
2. Sistema salva no LocalStorage
3. Evento "storage" dispara
4. Todas as abas sincronizam
5. Cliente vê mudança imediatamente

## 🎨 Personalização

### Pausar Produtos
- Útil para produtos esgotados
- Produto some do cardápio do cliente
- Fica visível no admin (marcado em vermelho)
- Clique em "Ativar" para restaurar

### Pausar Categorias
- Oculta categoria inteira do site
- Todos os produtos da categoria somem
- Útil para cardápios sazonais
- Reative quando necessário

### Destaque de Produtos
- Produtos aparecem com borda dourada
- Fica no topo do cardápio
- Ideal para promoções

## 📱 Responsividade

O dashboard funciona perfeitamente em:
- 💻 Desktop (tela completa)
- 📱 Tablet (layout adaptado)
- 📲 Smartphone (interface mobile)

## 🚀 Fluxo de Trabalho Recomendado

### Início do Dia:
1. Acesse o dashboard
2. Verifique estoque
3. Ative/desative produtos conforme disponibilidade
4. Configure promoções do dia

### Durante o Expediente:
1. Use o PDV para vendas presenciais
2. Monitore pedidos online na aba "Pedidos"
3. Atualize status conforme preparo
4. Pause produtos se acabar estoque

### Fim do Dia:
1. Verifique analytics
2. Confira faturamento
3. Analise produtos mais vendidos
4. Planeje cardápio do próximo dia

## 🔧 Atalhos e Dicas

- **Busca rápida no PDV**: Digite nome ou categoria
- **Edição rápida**: Clique no ícone de lápis
- **Exclusão**: Confirma antes de deletar
- **Carrinho PDV**: Use +/- para ajustar quantidades
- **Limpar carrinho**: Botão rápido disponível
- **Sair do admin**: Botão vermelho no topo

## 🎯 Melhores Práticas

1. **Fotos de produtos**: Use imagens de qualidade
2. **Descrições**: Seja detalhado sobre ingredientes
3. **Preços**: Sempre atualizados
4. **Status de pedidos**: Mantenha o cliente informado
5. **Categorias**: Use nomes claros e objetivos
6. **Estoque**: Atualize regularmente

## 🆘 Troubleshooting

### Produtos não aparecem no site:
- ✅ Verifique se está "Ativo"
- ✅ Verifique se a categoria está ativa
- ✅ Recarregue a página

### Pedidos não sincronizam:
- ✅ Verifique se ambas as abas estão abertas
- ✅ Limpe o cache do navegador
- ✅ Recarregue ambas as páginas

### Imagens não carregam:
- ✅ Verifique formato (JPG, PNG)
- ✅ Verifique tamanho do arquivo
- ✅ Tente fazer upload novamente

## 🔐 Segurança

⚠️ **Importante**: Este é um sistema demo. Em produção, você deve:
- Implementar autenticação real
- Usar backend seguro
- Criptografar dados sensíveis
- Controlar permissões de acesso
- Fazer backup regular dos dados

## 📞 Suporte

Para dúvidas ou problemas:
- 📱 WhatsApp: (13) 99651-1793
- 📧 Email: contato@pizzariattera.com.br

---

**Desenvolvido com ❤️ para Pizzaria Zattera**
