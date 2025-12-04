// app/api/admin/vets/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET: Buscar detalhes de um único veterinário para a tela de edição
export async function GET(
  req: Request,
  { params }: { params: { id: string } } 
) {
  try {
    const { id } = params;

    const vet = await prisma.user.findUnique({
      where: { id, role: 'VET' },
      select: {
        id: true,
        name: true,
        email: true,
        crmv: true,
        specialty: true,
        inviteToken: true,
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

// PATCH: Atualizar informações ou senha do veterinário
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } } 
) {
  try {
    const { id } = params;
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

    const updatedVet = await prisma.user.update({
      where: { id, role: 'VET' },
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