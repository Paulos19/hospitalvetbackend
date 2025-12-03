import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validação dos dados de entrada
const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  cpf: z.string().min(11), // Idealmente adicionar validação de regex de CPF
  vetToken: z.string().min(1, "O código do médico é obrigatório"), // O Token de vinculação
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, cpf, vetToken } = registerSchema.parse(body);

    // 1. Verificar se o Médico existe pelo Token
    const vet = await prisma.user.findFirst({
      where: { inviteToken: vetToken, role: 'VET' } // Garante que é um VET
    });

    if (!vet) {
      return NextResponse.json(
        { error: 'Código do médico inválido ou não encontrado.' },
        { status: 400 }
      );
    }

    // 2. Verificar se email ou CPF já existem
    const userExists = await prisma.user.findFirst({
      where: { OR: [{ email }, { cpf }] }
    });

    if (userExists) {
      return NextResponse.json(
        { error: 'Usuário já cadastrado com este E-mail ou CPF.' },
        { status: 409 }
      );
    }

    // 3. Criar o Cliente vinculado ao Médico
    const hashedPassword = await bcrypt.hash(password, 10);

    const newClient = await prisma.user.create({
      data: {
        name,
        email,
        cpf,
        password: hashedPassword,
        role: 'CLIENT',
        myVetId: vet.id, // <--- O VINCULO MÁGICO ACONTECE AQUI
      },
    });

    // Remove a senha do retorno
    const { password: _, ...clientData } = newClient;

    return NextResponse.json({ 
      message: 'Cadastro realizado com sucesso!',
      user: clientData 
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar cadastro.' }, { status: 500 });
  }
}