import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import 'dotenv/config'
import ComicGame from './ComicGame'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

export default async function Home() {
  const rooms = await prisma.room.findMany({ include: { items: true } })
  const dialogues = await prisma.dialogue.findMany()
  
  return <ComicGame rooms={rooms} dialogues={dialogues} />
}