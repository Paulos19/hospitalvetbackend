import { prisma } from "@/lib/prisma";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; 
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const { idToken, vetToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Token do Google obrigatório" }, { status: 400 });
    }

    // 1. Verificar o token do Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Token inválido ou sem email" }, { status: 401 });
    }

    const { email, name, picture } = payload;

    // 2. Verificar se o usuário já existe
    // Não precisamos de 'include' pois myVetId está na própria tabela User
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Validar token do veterinário se fornecido
    let vetIdToLink: string | undefined;

    if (vetToken) {
      const vet = await prisma.user.findUnique({
        where: { inviteToken: vetToken }, // Busca na tabela User pelo token
      });
      
      // Garante que é um usuário do tipo VET
      if (vet && vet.role === 'VET') {
        vetIdToLink = vet.id;
      } else {
        return NextResponse.json({ error: "Token do veterinário inválido." }, { status: 400 });
      }
    }

    // 3. Criar ou Atualizar Usuário
    if (!user) {
      // --- CRIAÇÃO ---
      user = await prisma.user.create({
        data: {
          name: name || "Usuário Google",
          email,
          password: "", // Sem senha
          role: "CLIENT",
          photoUrl: picture,
          myVetId: vetIdToLink, // Vincula diretamente na criação se houver token
        },
      });

    } else {
      // --- ATUALIZAÇÃO ---
      
      // Atualiza foto se necessário
      if (picture && user.photoUrl !== picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { photoUrl: picture },
        });
      }

      // Se é CLIENT, não tem vet vinculado e enviou token agora
      if (user.role === 'CLIENT' && !user.myVetId && vetIdToLink) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { myVetId: vetIdToLink }, // Atualiza o campo myVetId na tabela User
        });
      }
    }

    // 4. Gerar Token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "7d" }
    );

    // 5. Verificar status de bloqueio
    // Bloqueia se for CLIENT e o campo myVetId estiver vazio
    const isBlocked = user.role === "CLIENT" && !user.myVetId;

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        requiresVetToken: isBlocked 
      },
    });

  } catch (error) {
    console.error("Erro no login Google:", error);
    return NextResponse.json({ error: "Falha na autenticação com Google" }, { status: 500 });
  }
}