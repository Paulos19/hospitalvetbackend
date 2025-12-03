import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Busca usuários (Tutor) que tenham o myVetId igual ao ID do médico logado
    const clients = await prisma.user.findMany({
      where: { 
        myVetId: decoded.userId,
        role: 'CLIENT' 
      },
      include: {
        pets: true // Trazemos os pets junto para facilitar a visualização
      }
    });

    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar pacientes.' }, { status: 500 });
  }
}