import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET - Ler pedidos para exibir no site
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'orders-sync.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { orders: [], lastSync: null },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erro ao ler pedidos:', error);
    return NextResponse.json(
      { orders: [], lastSync: null, error: 'Erro ao carregar pedidos' },
      { status: 500 }
    );
  }
}

// POST - Criar novo pedido do site para o PDV
export async function POST(request: Request) {
  try {
    const order = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'orders-from-website.json');
    
    // Ler pedidos existentes
    let existingOrders: { orders: any[]; lastSync: string } = { orders: [], lastSync: new Date().toISOString() };
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      existingOrders = JSON.parse(fileContent);
    }

    // Adicionar novo pedido
    existingOrders.orders.push({
      ...order,
      createdAt: new Date().toISOString(),
      source: 'website'
    });
    existingOrders.lastSync = new Date().toISOString();

    // Salvar arquivo
    fs.writeFileSync(filePath, JSON.stringify(existingOrders, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: 'Pedido enviado para o PDV',
      orderId: order.id 
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar pedido' },
      { status: 500 }
    );
  }
}
