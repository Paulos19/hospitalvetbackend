import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, dateAdministered, nextDueDate, petId } = body;

    const vaccine = await prisma.vaccination.create({
      data: {
        name,
        dateAdministered: new Date(dateAdministered), // Recebe string ISO
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        petId
      }
    });

    return NextResponse.json(vaccine, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao registrar vacina' }, { status: 500 });
  }
}