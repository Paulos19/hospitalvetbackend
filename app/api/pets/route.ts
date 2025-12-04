import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const ownerId = decoded.userId;

    const body = await req.json();
    // ATUALIZADO: Recebendo birthDate
    const { name, type, breed, weight, photoUrl, birthDate } = body;

    const pet = await prisma.pet.create({
      data: {
        name,
        type, 
        breed,
        weight: weight ? parseFloat(weight) : null,
        // ATUALIZADO: Convertendo string ISO para Date objeto
        birthDate: birthDate ? new Date(birthDate) : null,
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

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    const pets = await prisma.pet.findMany({
      where: { ownerId: decoded.userId },
      orderBy: { name: 'asc' } // Opcional: ordenar por nome
    });

    return NextResponse.json(pets);
  } catch (err) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}