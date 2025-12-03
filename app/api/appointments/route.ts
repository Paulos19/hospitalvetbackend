import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura';

// POST: Criar Agendamento
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, reason, petId, clientId } = body;
    
    // Validação de Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    // Quem está criando é o Médico (pegamos o ID do token)
    const doctorId = decoded.userId; 

    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(date), // O Front envia ISO string
        reason,
        status: 'AGENDADO',
        petId,
        clientId,
        doctorId
      }
    });

    return NextResponse.json(appointment, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 });
  }
}

// GET: Listar Agendamentos
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    let whereClause = {};

    // Se for VET, busca agendamentos onde ele é o médico
    if (decoded.role === 'VET') {
      whereClause = { doctorId: decoded.userId };
    } 
    // Se for CLIENT, busca agendamentos onde ele é o cliente
    else if (decoded.role === 'CLIENT') {
      whereClause = { clientId: decoded.userId };
    }

    // Busca agendamentos futuros ou recentes
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        pet: { select: { name: true, photoUrl: true } },
        client: { select: { name: true } },
        doctor: { select: { name: true } }
      },
      orderBy: { date: 'asc' } // Do mais próximo para o mais longe
    });

    return NextResponse.json(appointments);

  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 });
  }
}