import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
// Assumindo que você tem Zod instalado no backend para validação
import { z } from 'zod'; 

// Esquema de validação para os dados do novo veterinário
const VetSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
  crmv: z.string().min(5, "CRMV é obrigatório."),
  specialty: z.string().optional(),
});

// Função utilitária para gerar um token simples (Nome-Random)
function generateInviteToken(name: string): string {
  const shortName = name.split(' ')[0].toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
  return `${shortName}-${random}`;
}

export async function POST(req: Request) {
  // TODO: Em produção real, valide se o usuário logado é ADMIN via JWT
  
  try {
    const body = await req.json();
    const validatedData = VetSchema.parse(body);

    const { name, email, password, crmv, specialty } = validatedData;

    // 1. Verificar unicidade do E-mail e CRMV
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { crmv }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 });
      }
      if (existingUser.crmv === crmv) {
        return NextResponse.json({ error: 'CRMV já cadastrado.' }, { status: 409 });
      }
    }

    // 2. Hash da Senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Gerar Token de Convite Único
    const inviteToken = generateInviteToken(name);

    // 4. Criar o novo veterinário
    const newVet = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        crmv,
        specialty,
        role: 'VET',
        inviteToken,
      },
    });

    // Remove a senha antes de retornar
    const { password: _, ...vetData } = newVet;

    return NextResponse.json({ 
      message: 'Veterinário cadastrado com sucesso!', 
      vet: vetData 
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Erro ao cadastrar veterinário:", error);
    return NextResponse.json({ error: 'Erro interno ao cadastrar veterinário.' }, { status: 500 });
  }
}