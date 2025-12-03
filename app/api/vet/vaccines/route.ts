import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/notifications"; // Certifique-se que criou este arquivo no passo anterior
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Autenticação e Autorização
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    
    const token = authHeader.split(" ")[1];
    // Decodifica o token para saber quem está fazendo a requisição
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");

    // Apenas veterinários podem lançar vacinas
    if (decoded.role !== 'VET') {
        return NextResponse.json({ error: "Acesso negado. Apenas veterinários." }, { status: 403 });
    }
    
    // 2. Dados da Requisição
    const { name, dateAdministered, nextDueDate, petId } = await req.json();

    if (!name || !dateAdministered || !petId) {
        return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    // 3. Criar a vacina no banco
    const vaccine = await prisma.vaccination.create({
      data: {
        name,
        dateAdministered: new Date(dateAdministered),
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        petId,
      },
    });

    // 4. Lógica de Notificação
    // Buscamos o pet e incluímos o dono (owner) para acessar o pushToken
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: { owner: true }
    });

    // Se o pet tem dono e o dono tem um token de notificação salvo...
    if (pet && pet.owner && pet.owner.pushToken) {
      await sendPushNotification(
        pet.owner.pushToken,
        'Vacina Aplicada! 💉',
        `O registro da vacina ${name} para ${pet.name} foi atualizado.`,
        { petId: pet.id } // Dados extras que podem servir para abrir a tela do pet ao clicar
      );
    }

    return NextResponse.json(vaccine);

  } catch (error) {
    console.error("Erro ao registrar vacina:", error);
    return NextResponse.json({ error: "Erro interno ao processar vacina" }, { status: 500 });
  }
}