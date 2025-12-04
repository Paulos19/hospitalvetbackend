import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Esta rota permite buscar dados públicos de um usuário (ex: Veterinário) pelo ID
type RouteProps = { params: Promise<{ id: string }> };

export async function GET(req: Request, props: RouteProps) {
  const params = await props.params;

  try {
    // Busca apenas dados seguros (sem senha, etc)
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        photoUrl: true,
        role: true,
        crmv: true,      // Importante para VET
        specialty: true, // Importante para VET
        phone: true,
        address: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 });
  }
}