import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import 'dotenv/config'
import { createItem } from './actions'

// Разрешаем блокирующий рендер: страница читает базу при каждом открытии
export const instant = false

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

export default async function AdminPage() {
  const rooms = await prisma.room.findMany({ select: { id: true, name: true } })

  return (
    <main className="p-8 font-mono text-white bg-black min-h-screen">
      <h1 className="text-xl mb-6 text-blue-400">Добавить предмет</h1>

      <form action={createItem} className="flex flex-col gap-3 max-w-md">
        <input name="name" placeholder="Название предмета" className="bg-black border-2 border-gray-600 p-2" />
        <textarea
          name="descriptions"
          placeholder="Монологи (разделяй вертикальной чертой |)"
          className="bg-black border-2 border-gray-600 p-2"
          rows={5}
        />
        <select name="roomId" defaultValue="" className="bg-black border-2 border-gray-600 p-2">
          <option value="">Выберите комнату...</option>
          {rooms.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button type="submit" className="bg-blue-600 py-2 uppercase tracking-widest hover:bg-blue-500">
          Создать предмет
        </button>
      </form>
    </main>
  )
}
