import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Função simples para gerar token (Ex: VET-SILVA-1234)
function generateVetToken(name: string) {
  const cleanName = name.split(' ')[0].toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `VET-${cleanName}-${random}`;
}

export async function POST(req: Request) {
  // TODO: Adicionar verificação se quem chama essa rota é ADMIN (Middleware JWT)
  
  try {
    const body = await req.json();
    const { name, email, password, cpf, crmv, specialty } = body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = generateVetToken(name);

    const newVet = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        cpf,
        role: 'VET',
        crmv,           // Específico de Vet
        specialty,      // Específico de Vet
        inviteToken: token // O token que ele passará aos clientes
      }
    });

    return NextResponse.json({ 
      message: 'Veterinário criado.', 
      inviteToken: newVet.inviteToken // Retorna o token para o Admin enviar ao médico
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao criar veterinário' }, { status: 500 });
  }
}