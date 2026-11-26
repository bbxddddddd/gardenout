import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import 'dotenv/config'
import { revalidatePath } from 'next/cache'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

export default async function AdminPage() {
  // Получаем комнаты вместе с их предметами
  const rooms = await prisma.room.findMany({
    include: { items: true }
  })

  // Функция для создания новой комнаты
  async function createRoom(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (name && description) {
      await prisma.room.create({
        data: {
          name,
          description,
          image: '/images/prototype_bedroom.jpg', // Заглушка
        }
      })
      revalidatePath('/admin')
      revalidatePath('/')
    }
  }

  // Функция для создания нового предмета
  async function createItem(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const descriptions = formData.get('descriptions') as string
    const roomId = Number(formData.get('roomId'))

    if (name && descriptions && roomId) {
      await prisma.item.create({
        data: {
          name,
          descriptions,
          roomId
        }
      })
      revalidatePath('/admin')
      revalidatePath('/')
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-8 font-mono">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl">Админ-панель</h1>
        <a href="/" className="text-green-500 hover:text-green-400">← Вернуться в игру</a>
      </div>
      
      <div className="flex gap-8">
        
        {/* ЛЕВАЯ КОЛОНКА: Формы создания */}
        <div className="w-1/3 flex flex-col gap-8">
          
          {/* Форма создания комнаты */}
          <div className="bg-gray-900 p-6 rounded border border-gray-700">
            <h2 className="text-xl mb-4 text-green-400">Добавить комнату</h2>
            <form action={createRoom} className="flex flex-col gap-4">
              <input name="name" placeholder="Название" className="p-2 bg-black border border-gray-600 text-white" required />
              <textarea name="description" placeholder="Описание" className="p-2 bg-black border border-gray-600 text-white" required />
              <button type="submit" className="bg-green-600 p-2 hover:bg-green-700 font-bold">Создать комнату</button>
            </form>
          </div>

          {/* Форма создания предмета */}
          <div className="bg-gray-900 p-6 rounded border border-gray-700">
            <h2 className="text-xl mb-4 text-blue-400">Добавить предмет</h2>
            <form action={createItem} className="flex flex-col gap-4">
              <input name="name" placeholder="Название предмета" className="p-2 bg-black border border-gray-600 text-white" required />
              <textarea name="descriptions" placeholder="Тексты (разделяй вертикальной чертой |)" className="p-2 bg-black border border-gray-600 text-white h-24" required />
              
              <select name="roomId" className="p-2 bg-black border border-gray-600 text-white" required>
                <option value="">Выберите комнату...</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>

              <button type="submit" className="bg-blue-600 p-2 hover:bg-blue-700 font-bold">Создать предмет</button>
            </form>
          </div>

        </div>

        {/* ПРАВАЯ КОЛОНКА: Списки */}
        <div className="w-2/3 bg-gray-900 p-6 rounded border border-gray-700">
          <h2 className="text-xl mb-4">Список комнат и предметов</h2>
          <ul className="flex flex-col gap-4">
            {rooms.map(room => (
              <li key={room.id} className="border border-gray-700 p-4 rounded bg-black">
                <strong className="text-green-400 text-lg block mb-2">{room.name}</strong>
                <p className="text-gray-400 text-sm mb-4">{room.description}</p>
                
                <div className="ml-4 border-l-2 border-gray-600 pl-4">
                  <span className="text-gray-300 text-sm font-bold block mb-2">Предметы в комнате ({room.items.length}):</span>
                  {room.items.length > 0 ? (
                    <ul className="text-sm flex flex-col gap-1">
                      {room.items.map(item => (
                        <li key={item.id} className="text-blue-300">
                          • {item.name} <span className="text-gray-500 text-xs">({item.descriptions.split('|').length} вариантов текста)</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500 text-sm italic">Нет предметов</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </main>
  )
}