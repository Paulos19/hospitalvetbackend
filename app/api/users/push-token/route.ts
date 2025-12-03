import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    // 1. Verificar Autenticação (pegar o token do Header)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    // Decodifica o token para saber QUEM é o usuário
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    const userId = decoded.id; // Certifique-se que seu JWT tem o campo 'id'

    // 2. Ler o pushToken enviado pelo Front
    const { pushToken } = await req.json();

    if (!pushToken) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 400 });
    }

    // 3. Salvar no Banco
    await prisma.user.update({
      where: { id: userId },
      data: { pushToken },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro ao salvar push token:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}