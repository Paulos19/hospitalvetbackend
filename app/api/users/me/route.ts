import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

export async function GET(req: Request) {
  try {
    const headersList = headers();
    const token = (await headersList).get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Decodifica o token para pegar o ID (ajuste conforme seu segredo JWT)
    // Nota: O ideal é usar uma função helper de verificação que você já deve ter
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        photoUrl: true,
        myVetId: true, // <--- ESSENCIAL: Retornar isso para o frontend saber
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);

  } catch (error) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}

// PATCH: Atualizar dados (Foto, Nome, etc)
export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const body = await req.json();
    // ATUALIZADO: Aceita mais campos além da foto
    const { photoUrl, name, phone, address } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        photoUrl,
        name,
        phone,
        address
      },
    });

    const { password: _, ...user } = updatedUser;
    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}