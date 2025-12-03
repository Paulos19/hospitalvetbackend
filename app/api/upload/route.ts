import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'image.jpg';

    // 1. Ler o FormData da requisição (padrão robusto para arquivos)
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo encontrado.' }, { status: 400 });
    }

    // 2. Enviar para o Vercel Blob
    // O Vercel Blob aceita o objeto File diretamente
    const blob = await put(filename, file as File, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { error: 'Erro ao processar upload.' },
      { status: 500 }
    );
  }
}