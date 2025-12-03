import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    
    const { vetToken } = await req.json();

    if (!vetToken) {
      return NextResponse.json({ error: "Token do veterinário é obrigatório" }, { status: 400 });
    }

    // Buscar o veterinário na tabela User pelo token
    const vet = await prisma.user.findUnique({
      where: { inviteToken: vetToken },
    });

    if (!vet || vet.role !== 'VET') {
      return NextResponse.json({ error: "Token inválido ou veterinário não encontrado" }, { status: 404 });
    }

    // Atualizar o usuário logado (CLIENT) com o ID do veterinário
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { myVetId: vet.id },
    });

    return NextResponse.json({ success: true, message: "Veterinário vinculado com sucesso!" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao vincular veterinário" }, { status: 500 });
  }
}