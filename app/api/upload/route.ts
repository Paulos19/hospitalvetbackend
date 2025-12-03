import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename') || 'pet-photo.jpg';

  // CORREÇÃO: Verificamos se o body existe antes de passar para o put
  if (!request.body) {
    return NextResponse.json(
      { error: 'Nenhum arquivo enviado.' },
      { status: 400 }
    );
  }

  try {
    // Agora o TypeScript sabe que request.body não é null
    const blob = await put(filename, request.body, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload da imagem.' },
      { status: 500 }
    );
  }
}