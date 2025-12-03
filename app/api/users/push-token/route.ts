import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    // Decodifica o token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    
    // CORREÇÃO: Usar 'userId' em vez de 'id', pois foi assim que foi gravado no Login/Google
    const userId = decoded.userId; 

    const { pushToken } = await req.json();

    if (!pushToken) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId }, // Agora userId terá o valor correto
      data: { pushToken },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro ao salvar push token:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}