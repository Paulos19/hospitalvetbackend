import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Token ausente' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    let userId;
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await req.json();
    let { inviteToken } = body;

    if (!inviteToken || typeof inviteToken !== 'string') {
      return NextResponse.json({ error: 'Código inválido.' }, { status: 400 });
    }

    inviteToken = inviteToken.trim().toUpperCase();

    // Busca o veterinário
    const vet = await prisma.user.findUnique({
      where: { inviteToken, role: 'VET' }
    });

    if (!vet) {
      return NextResponse.json({ error: 'Veterinário não encontrado com este código.' }, { status: 404 });
    }

    // Vincula o usuário ao veterinário
    await prisma.user.update({
      where: { id: userId },
      data: { myVetId: vet.id }
    });

    // ATUALIZADO: Retorna dados completos para o front já mostrar o card
    return NextResponse.json({ 
      message: 'Vínculo realizado!',
      vetId: vet.id,
      vetName: vet.name,
      specialty: vet.specialty,
      crmv: vet.crmv,
      photoUrl: vet.photoUrl
    });

  } catch (error) {
    console.error("Link Vet Error:", error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}