import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

// Helper para pegar ID do usuario
function getUserId(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

// Definição do tipo para props da rota (Next.js 15+)
type RouteProps = {
  params: Promise<{ id: string }>;
};

// GET: Buscar um pet específico
export async function GET(req: Request, props: RouteProps) {
  const params = await props.params; // <--- AWAIT ESSENCIAL AQUI
  
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const pet = await prisma.pet.findUnique({
    where: { id: params.id }
  });

  if (!pet) return NextResponse.json({ error: 'Pet não encontrado' }, { status: 404 });

  return NextResponse.json(pet);
}

// PUT: Atualizar Pet
export async function PUT(req: Request, props: RouteProps) {
  const params = await props.params; // <--- AWAIT ESSENCIAL AQUI

  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, breed, weight, birthDate, type, photoUrl } = body;

    // 1. Verifica se o pet existe e pertence ao usuário
    const existingPet = await prisma.pet.findUnique({
        where: { id: params.id }
    });

    if (!existingPet || existingPet.ownerId !== userId) {
        return NextResponse.json({ error: 'Pet não encontrado ou sem permissão' }, { status: 403 });
    }

    // 2. Atualiza
    const updatedPet = await prisma.pet.update({
      where: { id: params.id },
      data: {
        name,
        breed,
        type,
        weight: weight !== undefined ? parseFloat(weight) : undefined,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        photoUrl
      }
    });

    return NextResponse.json(updatedPet);
  } catch (error) {
    console.error("Erro ao atualizar pet:", error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}