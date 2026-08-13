import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { telefone, nome, items } = await request.json();
    if (!telefone) return NextResponse.json({ success: false });

    // Verifica se já tem histórico
    const { data: existing } = await supabase
      .from('carrinhos_abandonados')
      .select('*')
      .eq('telefone', telefone)
      .single();

    let dbError;

    if (items && items.length > 0) {
      const itensSummary = items.map((i: any) => `${i.quantity || 1}x ${i.nome}`).join(', ');
      
      if (existing) {
        const { error } = await supabase
          .from('carrinhos_abandonados')
          .update({ itens_summary: itensSummary, nome, status: 'Com itens na sacola' })
          .eq('telefone', telefone);
        dbError = error;
      } else {
        const { error } = await supabase
          .from('carrinhos_abandonados')
          .insert([{ telefone, nome, itens_summary: itensSummary, status: 'Com itens na sacola' }]);
        dbError = error;
      }
    } else {
      // Se esvaziou, mantém o resumo dos itens intacto e muda apenas o status!
      if (existing) {
         const { error } = await supabase
          .from('carrinhos_abandonados')
          .update({ status: 'Esvaziou a sacola (Histórico mantido)' })
          .eq('telefone', telefone);
         dbError = error;
      }
    }

    if (dbError) throw dbError;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('carrinhos_abandonados')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: 'Erro' }, { status: 500 });
  }
}