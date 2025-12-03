import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    
    const { pushToken } = await req.json();

    if (!pushToken) {
      return NextResponse.json({ error: "Token de push é obrigatório" }, { status: 400 });
    }

    // Atualiza o usuário com o novo token
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { pushToken },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro ao salvar push token:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}