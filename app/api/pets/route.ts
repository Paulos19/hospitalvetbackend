import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

export async function POST(req: Request) {
  try {
    // 1. Validar Autenticação (Pegar ID do usuário logado)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const ownerId = decoded.userId;

    // 2. Pegar dados do corpo
    const body = await req.json();
    const { name, type, breed, weight, photoUrl } = body;

    // 3. Salvar no Banco
    const pet = await prisma.pet.create({
      data: {
        name,
        type, // Certifique-se de enviar: 'CACHORRO', 'GATO', etc.
        breed,
        weight: parseFloat(weight),
        photoUrl,
        ownerId
      }
    });

    return NextResponse.json(pet, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao cadastrar pet' }, { status: 500 });
  }
}

// Rota GET para listar os pets na Home
export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  
  const token = authHeader.split(' ')[1];
  const decoded: any = jwt.verify(token, JWT_SECRET);

  const pets = await prisma.pet.findMany({
    where: { ownerId: decoded.userId }
  });

  return NextResponse.json(pets);
}