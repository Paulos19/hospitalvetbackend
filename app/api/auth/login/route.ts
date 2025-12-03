import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  // Cria o token JWT contendo ID e ROLE
  const token = jwt.sign(
    { userId: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' } // Token válido por 7 dias (bom para mobile)
  );

  return NextResponse.json({ 
    token, 
    user: { 
      id: user.id, 
      name: user.name, 
      role: user.role, 
      inviteToken: user.inviteToken // Se for vet, já recebe o token para compartilhar
    } 
  });
}