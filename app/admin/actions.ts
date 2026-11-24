'use server'

import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import 'dotenv/config'
import { revalidatePath } from 'next/cache'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

export async function createRoom(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const image = formData.get('image') as string

  if (!name || !description || !image) return

  await prisma.room.create({
    data: {
      name,
      description,
      image,
      items: { create: [] } // Комната создается пустой
    }
  })

  // Обновляем кэш страницы админки, чтобы новая комната сразу появилась в списке
  revalidatePath('/admin')
}

export async function createItem(formData: FormData) {
  const name = formData.get('name') as string
  const descriptions = formData.get('descriptions') as string
  const roomId = Number(formData.get('roomId'))

  if (!name || !descriptions || !roomId) return

  await prisma.item.create({
    data: {
      name,
      descriptions, // Пишем через разделитель |
      roomId
    }
  })

  revalidatePath('/admin')
}