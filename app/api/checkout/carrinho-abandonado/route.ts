import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { telefone, nome, items } = await request.json();
    if (!telefone || !items || items.length === 0) {
      return NextResponse.json({ success: false });
    }

    const itensSummary = items.map((i: any) => `${i.quantity || 1}x ${i.nome}`).join(', ');

    // Salva ou atualiza no Supabase corrigido
    const { error } = await supabase
      .from('carrinhos_abandonados')
      .upsert([{ telefone, nome, itens_summary: itensSummary }], { onConflict: 'telefone' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}