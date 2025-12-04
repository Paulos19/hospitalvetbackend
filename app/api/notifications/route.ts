import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

// Helper para pegar o usuário do token
function getUserFromToken(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string, role: string };
  } catch (e) {
    return null;
  }
}

// GET: Listar notificações do usuário
export async function GET(req: Request) {
  try {
    const user = getUserFromToken(req);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        pet: {
          select: { name: true, photoUrl: true }
        }
      }
    });

    return NextResponse.json(notifications);

  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    // Se o erro for de tabela inexistente (p2021), avisa para rodar a migration
    return NextResponse.json({ error: 'Erro ao buscar notificações.' }, { status: 500 });
  }
}

// PATCH: Marcar notificações como lidas
export async function PATCH(req: Request) {
  try {
    const user = getUserFromToken(req);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
       return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 });
    }

    // Marca como lidas apenas as notificações que pertencem a este usuário
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: user.userId
      },
      data: { read: true }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar notificações.' }, { status: 500 });
  }
}