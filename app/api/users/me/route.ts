import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

// GET: Retorna os dados do usuário logado + Veterinário Vinculado
export async function GET(req: Request) {
    try {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
            // Inclui os dados do veterinário vinculado
            myVet: {
                select: {
                    id: true,
                    name: true,
                    specialty: true,
                    crmv: true,
                    photoUrl: true
                }
            }
        }
      });
  
      if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  
      const { password: _, ...userWithoutPass } = user;
      return NextResponse.json(userWithoutPass);
  
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 });
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