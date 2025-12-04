import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

// Helper de autenticação
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
    // Verifica se o pet pertence ao dono ou se o user é o vet vinculado (lógica futura)
    // Por enquanto, validamos se o user é dono do pet
    const pet = await prisma.pet.findUnique({ where: { id: params.id } });
    
    if (!pet || pet.ownerId !== userId) {
        // Se não for o dono, verificamos se é o veterinário vinculado (se implementarmos acesso Vet aqui)
        // Por simplificação: apenas dono acessa por enquanto
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const vaccines = await prisma.vaccination.findMany({
      where: { petId: params.id },
      orderBy: { dateAdministered: 'desc' } // Mais recentes primeiro
    });

    return NextResponse.json(vaccines);

  } catch (error) {
    console.error("Erro ao buscar vacinas:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}