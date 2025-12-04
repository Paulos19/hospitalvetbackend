// app/api/admin/vets/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  // TODO: Em produção real, valide se o usuário logado é ADMIN via JWT
  
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase();

    let whereClause: any = { role: 'VET' };

    if (search && search.length > 0) {
      whereClause = {
        role: 'VET',
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { crmv: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const vets = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        crmv: true,
        inviteToken: true,
        _count: {
          select: { patients: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedVets = vets.map(vet => ({
        id: vet.id,
        name: vet.name,
        email: vet.email,
        crmv: vet.crmv,
        inviteToken: vet.inviteToken,
        patientsCount: vet._count.patients,
    }));


    return NextResponse.json(formattedVets);

  } catch (error) {
    console.error("Erro ao buscar veterinários:", error);
    return NextResponse.json({ error: 'Erro ao buscar veterinários' }, { status: 500 });
  }
}