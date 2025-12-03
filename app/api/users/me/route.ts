import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

// PATCH: Atualizar dados do próprio usuário logado
export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const body = await req.json();
    const { photoUrl } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        photoUrl // Atualiza apenas a foto se enviada
      },
    });

    // Remove a senha do retorno
    const { password: _, ...user } = updatedUser;

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}