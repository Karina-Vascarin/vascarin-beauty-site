import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { telefone, nome, items, visitas } = await request.json();
    if (!telefone) return NextResponse.json({ success: false });

    // A MÁGICA AQUI: maybeSingle() não dá erro se o cliente for novo
    const { data: existing, error: searchError } = await supabase
      .from('carrinhos_abandonados')
      .select('*')
      .eq('telefone', telefone)
      .maybeSingle(); 

    if (searchError) throw searchError;

    let dbError;
    const numVisitas = visitas || 1;

    if (items && items.length > 0) {
      const itensSummary = items.map((i: any) => `${i.quantity || 1}x ${i.nome}`).join(', ');
      
      if (existing) {
        const { error } = await supabase
          .from('carrinhos_abandonados')
          .update({ itens_summary: itensSummary, nome, status: 'Com itens na sacola', visitas: numVisitas })
          .eq('telefone', telefone);
        dbError = error;
      } else {
        const { error } = await supabase
          .from('carrinhos_abandonados')
          .insert([{ telefone, nome, itens_summary: itensSummary, status: 'Com itens na sacola', visitas: numVisitas }]);
        dbError = error;
      }
    } else {
      if (existing) {
         const { error } = await supabase
          .from('carrinhos_abandonados')
          .update({ status: 'Esvaziou a sacola', visitas: numVisitas })
          .eq('telefone', telefone);
         dbError = error;
      }
    }

    if (dbError) throw dbError;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API:", error);
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