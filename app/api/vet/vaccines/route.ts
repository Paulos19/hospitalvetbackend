import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/notifications";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Autenticação e Autorização
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");

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

    // 4. Lógica de Notificação Completa (Persistência + Push)
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: { owner: true }
    });

    if (pet && pet.owner) {
      const title = 'Vacina Aplicada! 💉';
      const message = `O registro da vacina ${name} para ${pet.name} foi atualizado.`;

      // A) Salvar notificação no Banco de Dados (Para aparecer na tela de notificações)
      // Nota: Certifique-se de que o model Notification foi criado no schema.prisma
      await prisma.notification.create({
        data: {
          userId: pet.owner.id,
          petId: pet.id,
          title,
          message,
          type: 'VACCINE',
          read: false
        }
      });

      // B) Enviar Push Notification (Para avisar no celular)
      if (pet.owner.pushToken) {
        await sendPushNotification(
          pet.owner.pushToken,
          title,
          message,
          { petId: pet.id, type: 'VACCINE' }
        );
      }
    }

    return NextResponse.json(vaccine);

  } catch (error) {
    console.error("Erro ao registrar vacina:", error);
    return NextResponse.json({ error: "Erro interno ao processar vacina" }, { status: 500 });
  }
}