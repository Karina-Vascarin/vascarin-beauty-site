import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/products';

export async function GET() {
  try {
    const produtos = await getProducts();
    return NextResponse.json(produtos);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar produtos' }, { status: 500 });
  }
}