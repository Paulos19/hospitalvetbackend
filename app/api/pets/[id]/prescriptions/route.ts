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

  try {
    const pet = await prisma.pet.findUnique({ where: { id: params.id } });
    if (!pet || pet.ownerId !== userId) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { petId: params.id },
      orderBy: { issuedAt: 'desc' }
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}