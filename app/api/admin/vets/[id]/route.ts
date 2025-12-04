import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET: Buscar detalhes completos do veterinário
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vet = await prisma.user.findFirst({
      where: { id, role: 'VET' },
      select: {
        id: true,
        name: true,
        email: true,
        crmv: true,
        specialty: true,
        inviteToken: true,
        photoUrl: true,
        // CORREÇÃO: Adicionados os campos que faltavam
        createdAt: true, 
        _count: {
          select: {
            patients: true
          }
        }
      },
    });

    if (!vet) {
      return NextResponse.json({ error: 'Veterinário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(vet);
  } catch (error) {
    console.error("Erro ao buscar detalhes:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PATCH: Atualizar senha ou dados
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.crmv !== undefined) updateData.crmv = body.crmv;
    if (body.specialty !== undefined) updateData.specialty = body.specialty;

    // Lógica de troca de senha
    if (body.password) {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 });
    }

    const updatedVet = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: 'Atualizado com sucesso!', vet: updatedVet });

  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}