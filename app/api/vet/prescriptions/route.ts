import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, medications, petId } = body;

    if (!title || !description || !petId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const prescription = await prisma.prescription.create({
      data: {
        title,
        description, // O corpo da receita (ex: Diagnóstico)
        medications, // Lista de remédios e posologia
        petId
      }
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao emitir receita' }, { status: 500 });
  }
}