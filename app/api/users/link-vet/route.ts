import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

export async function POST(req: Request) {
  try {
    // 1. Verificar Autenticação (Extrair ID do utilizador do Header)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autenticação não fornecido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId;

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.json({ error: 'Token de autenticação inválido' }, { status: 401 });
    }

    // 2. Ler e Validar o Body
    const body = await req.json();
    let { inviteToken } = body;

    console.log("Token recebido (Raw):", inviteToken); // Log para debug no terminal

    if (!inviteToken || typeof inviteToken !== 'string') {
      return NextResponse.json({ error: 'Token do veterinário é obrigatório e deve ser texto.' }, { status: 400 });
    }

    // Limpar espaços em branco e colocar em maiúsculas (para evitar erros de digitação)
    inviteToken = inviteToken.trim().toUpperCase();

    // 3. Buscar o Veterinário pelo Token
    const vet = await prisma.user.findUnique({
      where: { inviteToken, role: 'VET' }
    });

    if (!vet) {
      return NextResponse.json({ error: 'Código inválido. Veterinário não encontrado.' }, { status: 404 });
    }

    // 4. Atualizar o Cliente (Vincular ao Veterinário)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { myVetId: vet.id }
    });

    return NextResponse.json({ 
      message: 'Vínculo realizado com sucesso!',
      vetId: vet.id,
      vetName: vet.name
    });

  } catch (error) {
    console.error("Erro no Link Vet:", error);
    return NextResponse.json({ error: 'Erro interno ao vincular veterinário.' }, { status: 500 });
  }
}