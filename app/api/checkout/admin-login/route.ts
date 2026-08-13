import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Puxa as credenciais seguras da Vercel
    const validEmail = process.env.ADMIN_EMAIL;
    const validPassword = process.env.ADMIN_PASSWORD;

    if (email === validEmail && password === validPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}