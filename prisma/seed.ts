// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Pega o email do .env ou usa um fallback seguro
  const email = process.env.EMAIL_ADMIN
  
  if (!email) {
    console.error('❌ Erro: A variável EMAIL_ADMIN não está definida no .env')
    process.exit(1)
  }

  console.log(`🌱 Iniciando seed para o admin: ${email}...`)

  // Criptografa a senha fixa 'password'
  const passwordHash = await bcrypt.hash('password', 10)

  // Upsert: Cria se não existir, atualiza se existir (garante idempotência)
  const admin = await prisma.user.upsert({
    where: { email: email },
    update: {}, // Se já existe, não altera nada
    create: {
      email,
      name: 'Administrador Master',
      password: passwordHash,
      role: 'ADMIN',
      // CPF não é obrigatório no schema para ADMIN, então podemos omitir
    },
  })

  console.log(`✅ Admin criado/verificado com sucesso:`)
  console.log({ id: admin.id, email: admin.email, role: admin.role })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })