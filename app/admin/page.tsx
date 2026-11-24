import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import 'dotenv/config'
import Link from 'next/link'
import { createRoom, createItem } from './actions'

export const instant = false;

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

export default async function AdminPage() {
  const rooms = await prisma.room.findMany({
    include: { items: true }
  })

  return (
    <main className="min-h-screen bg-gray-900 text-white font-mono p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold uppercase tracking-widest">Админ-панель</h1>
          <Link href="/" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded border border-blue-400">
            Вернуться в игру
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-xl mb-4 text-green-400">Список комнат:</h2>
          <div className="grid gap-4">
            {rooms.map(room => (
              <div key={room.id} className="bg-gray-800 border border-gray-600 p-4 rounded">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold">{room.name}</h3>
                  <Link href={`/admin/edit-room/${room.id}`} className="text-sm text-yellow-400 hover:underline">
                    Редактировать
                  </Link>
                </div>
                <p className="text-sm text-gray-400 mb-2">Описание: {room.description}</p>
                <p className="text-sm text-gray-400 mb-2">Предметов в комнате: {room.items.length}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Здесь потом добавим формы создания */}
        <div className="p-4 border border-dashed border-gray-600 rounded text-center text-gray-500">
          [        {/* Форма создания комнаты */}
        <div className="mb-8 bg-gray-800 p-4 rounded border border-gray-700">
          <h2 className="text-xl mb-4 text-green-400">Создать новую комнату</h2>
          <form action={createRoom} className="flex flex-col gap-3">
            <input type="text" name="name" placeholder="Название (например, Чердак)" required className="p-2 bg-gray-900 border border-gray-600 rounded text-white" />
            <input type="text" name="description" placeholder="Описание комнаты" required className="p-2 bg-gray-900 border border-gray-600 rounded text-white" />
            <input type="text" name="image" placeholder="Путь к картинке (например, /images/attic.jpg)" required className="p-2 bg-gray-900 border border-gray-600 rounded text-white" />
            <button type="submit" className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded border border-green-500 self-start">Создать комнату</button>
          </form>
        </div>

        {/* Форма создания предмета */}
        <div className="bg-gray-800 p-4 rounded border border-gray-700">
          <h2 className="text-xl mb-4 text-green-400">Создать новый предмет</h2>
          <form action={createItem} className="flex flex-col gap-3">
            <input type="text" name="name" placeholder="Название предмета (например, Старый сундук)" required className="p-2 bg-gray-900 border border-gray-600 rounded text-white" />
            <textarea name="descriptions" placeholder="Текст монолога. Разделяйте вариации знаком |" required className="p-2 bg-gray-900 border border-gray-600 rounded text-white h-24" />
            
            <select name="roomId" required className="p-2 bg-gray-900 border border-gray-600 rounded text-white">
              <option value="">Выберите комнату...</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
            
            <button type="submit" className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded border border-green-500 self-start">Создать предмет</button>
          </form>
        </div>]
        </div>
      </div>
    </main>
  )
}