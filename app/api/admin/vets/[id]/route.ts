import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET: Buscar detalhes de um único veterinário
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // <--- CORREÇÃO 1: Tipagem como Promise
) {
  try {
    const { id } = await params; // <--- CORREÇÃO 2: Aguardar a resolução dos params

    // CORREÇÃO 3: Usar findFirst porque 'role' não é campo único, então não pode ir no findUnique junto com id
    const vet = await prisma.user.findFirst({
      where: { 
        id, 
        role: 'VET' 
      },
      select: {
        id: true,
        name: true,
        email: true,
        crmv: true,
        specialty: true,
        inviteToken: true,
        photoUrl: true, // Útil para mostrar a foto na edição
      },
    });

    if (!vet) {
      return NextResponse.json({ error: 'Veterinário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(vet);
  } catch (error) {
    console.error("Erro ao buscar detalhes do veterinário:", error);
    return NextResponse.json({ error: 'Erro interno ao buscar detalhes' }, { status: 500 });
  }
}

// PATCH: Atualizar informações
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // <--- CORREÇÃO 1
) {
  try {
    const { id } = await params; // <--- CORREÇÃO 2
    const body = await req.json();
    
    const updateData: any = {};

    // 1. Atualizar informações básicas
    if (body.name !== undefined) updateData.name = body.name;
    if (body.crmv !== undefined) updateData.crmv = body.crmv;
    if (body.specialty !== undefined) updateData.specialty = body.specialty;

    // 2. Alterar Senha
    if (body.password) {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'Nenhum dado válido fornecido para atualização.' }, { status: 400 });
    }

    // Nota: Aqui o 'update' exige um 'where' único (apenas ID).
    // Se quiser garantir que é VET, faça uma verificação antes ou use updateMany (mas update é melhor para ID)
    
    // Verificação de segurança opcional: garantir que é VET antes de atualizar
    const isVet = await prisma.user.findFirst({ where: { id, role: 'VET' } });
    if (!isVet) {
        return NextResponse.json({ error: 'Veterinário não encontrado' }, { status: 404 });
    }

    const updatedVet = await prisma.user.update({
      where: { id }, // No update, passamos apenas o ID
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
      }
    });

    return NextResponse.json({ message: 'Veterinário atualizado com sucesso!', vet: updatedVet });

  } catch (error) {
    console.error("Erro ao atualizar veterinário:", error);
    return NextResponse.json({ error: 'Erro interno ao atualizar veterinário' }, { status: 500 });
  }
}