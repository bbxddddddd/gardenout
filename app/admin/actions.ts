'use server'

import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import 'dotenv/config'
import { revalidatePath } from 'next/cache'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

// Заготовленные картинки: при создании предмету рандомно выдаётся одна из них
const itemImages = [
  "/images/shtyka1.png",
  "/images/shtyka2.png",
  "/images/shtyka3.png",
];

// Создание предмета через админку: имя, монологи через "|", комната
export async function createItem(formData: FormData) {
  const name = formData.get('name') as string
  const descriptions = formData.get('descriptions') as string
  const roomId = Number(formData.get('roomId'))

  if (!name || !descriptions || !roomId) return

  await prisma.item.create({
    data: {
      name,
      descriptions, // Пишем через разделитель |
      roomId,
      image: itemImages[Math.floor(Math.random() * itemImages.length)], // рандом закрепляется навсегда
    }
  })

  // Сбрасываем кэш, чтобы игра и админка перечитали базу
  revalidatePath('/')
  revalidatePath('/admin')
}
