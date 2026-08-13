import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { items, customer } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
    }

    // Montando os itens para a InfinitePay
    const payload = {
      handle: "vascarin_beauty",
      items: items.map((item: any) => ({
        description: item.nome,
        quantity: item.quantity || 1,
        price: Math.max(Math.round(Number(item.preco) * 100), 100) // Garante no mínimo 1 real para evitar erro
      })),
      customer: {
        name: customer?.name || "Cliente Vascarin",
        phone_number: customer?.phone || "11992465042",
        email: customer?.email || "srtkmenezes@gmail.com"
      }
    };

    const response = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro da InfinitePay:", data);
      return NextResponse.json({ error: data.message || 'Erro ao gerar link' }, { status: 400 });
    }

    return NextResponse.json({ url: data.payment_url || data.url || data.link });

  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json({ error: 'Falha ao processar pagamento' }, { status: 500 });
  }
}