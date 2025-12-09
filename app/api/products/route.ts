import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'products-sync.json');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { products: [], lastSync: null, error: 'Arquivo de sincronização não encontrado' },
        { status: 404 }
      );
    }

    // Ler arquivo
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erro ao ler produtos:', error);
    return NextResponse.json(
      { products: [], lastSync: null, error: 'Erro ao carregar produtos' },
      { status: 500 }
    );
  }
}
