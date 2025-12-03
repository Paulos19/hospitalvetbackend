import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// No Next.js 15+, params é uma Promise. Precisamos tipar assim:
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    // 1. Await no params para extrair o ID corretamente
    const { id } = await params;
    const petId = id;

    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: {
        vaccinations: { orderBy: { dateAdministered: 'desc' } },
        prescriptions: { orderBy: { issuedAt: 'desc' } },
        // Alteração aqui: Removemos o 'phone' do select para evitar o erro de validação
        // se o Prisma Client não tiver sido regenerado corretamente.
        owner: { 
          select: { 
            name: true, 
            // phone: true, // <--- Comentado temporariamente para corrigir o erro 500
            email: true     // Adicionei email que é útil e garantido que existe
          } 
        }
      }
    });

    if (!pet) {
      return NextResponse.json({ error: 'Pet não encontrado' }, { status: 404 });
    }

    return NextResponse.json(pet);

  } catch (error: any) {
    console.error("Erro detalhado ao buscar pet:", error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar detalhes do pet', details: error.message },
      { status: 500 }
    );
  }
}