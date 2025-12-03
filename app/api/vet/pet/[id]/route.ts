import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const petId = params.id;

    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: {
        vaccinations: { orderBy: { dateAdministered: 'desc' } },
        prescriptions: { orderBy: { issuedAt: 'desc' } },
        owner: { select: { name: true, phone: true } } // Útil para contato
      }
    });

    if (!pet) return NextResponse.json({ error: 'Pet não encontrado' }, { status: 404 });

    return NextResponse.json(pet);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar detalhes do pet' }, { status: 500 });
  }
}