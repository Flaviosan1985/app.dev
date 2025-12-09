import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'customers-sync.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { customers: [], lastSync: null },
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
    console.error('Erro ao ler clientes:', error);
    return NextResponse.json(
      { customers: [], lastSync: null, error: 'Erro ao carregar clientes' },
      { status: 500 }
    );
  }
}
