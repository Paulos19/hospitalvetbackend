import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

function getUserId(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (e) { return null; }
}

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(req: Request, props: RouteProps) {
  const params = await props.params;
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const pet = await prisma.pet.findUnique({ where: { id: params.id } });
  if (!pet) return NextResponse.json({ error: 'Pet não encontrado' }, { status: 404 });

  return NextResponse.json(pet);
}

export async function PUT(req: Request, props: RouteProps) {
  const params = await props.params;
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    // ATUALIZADO: Recebendo 'sex'
    const { name, breed, weight, birthDate, type, photoUrl, sex } = body;

    const existingPet = await prisma.pet.findUnique({ where: { id: params.id } });
    if (!existingPet || existingPet.ownerId !== userId) {
        return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const updatedPet = await prisma.pet.update({
      where: { id: params.id },
      data: {
        name,
        breed,
        type,
        sex, // <--- Atualizando
        weight: weight !== undefined ? parseFloat(weight) : undefined,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        photoUrl
      }
    });

    return NextResponse.json(updatedPet);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}