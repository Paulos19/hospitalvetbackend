import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  // TODO: Em produção real, valide se o usuário logado é ADMIN via JWT
  
  try {
    const vets = await prisma.user.findMany({
      where: { role: 'VET' },
      select: {
        id: true,
        name: true,
        email: true,
        crmv: true,
        inviteToken: true // Precisamos retornar o token para o Admin copiar
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(vets);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar veterinários' }, { status: 500 });
  }
}