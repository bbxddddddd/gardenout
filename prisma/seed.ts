import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  // Чистим таблицы перед заполнением, чтобы сид можно было запускать повторно
  await prisma.dialogue.deleteMany()
  await prisma.item.deleteMany()
  await prisma.room.deleteMany()
  await prisma.character.deleteMany()

  // СПАЛЬНЯ — полный набор предметов из второй версии
  await prisma.room.create({
    data: {
      name: "Спальня",
      description: "Твоя комната. Откуда этот резкий запах?!",
      image: "/images/prototype_bedroom.jpg",
      items: {
        create: [
          { name: "Очки-бинокуляры", descriptions: "> Шпиндель: Мои любимые очки. Чтобы их купить наша семья пять лет воровала еду из магазинов.|> Шпиндель: Шучу.|> Шпиндель: Мы делали так всегда." },
          { name: "Ноутбук", descriptions: "> Шпиндель: Мой о-о-очень старенький приятель.|> Шпиндель: Кажется я совершенно забыл выключить его, когда уходил.|> Шпиндель: это что Пиратские Приключения Лаггера и Мистика?" },
          { name: "Гора грязной посуды", descriptions: "> Шпиндель: ... |> Шпиндель: Совсем скоро я просто начну выкидывать грязную посуду из окна." },
          { name: "Чайный гриб", descriptions: "> Шпиндель: Ангон? Мама тебя еще не выкинула??|> Шпиндель: Да ты рекордсмен, стоишь здесь уже 12 дней!" },
          { name: "Носки", descriptions: "> Шпиндель: ... |> Шпиндель: Я не думаю, что мои носки имеют хоть какое-то значение для Вселенского масштаба.|> Шпиндель: ...  |> Шпиндель: Какая разница уберу я их сейчас или подожду, когда даже носки начнут делать со встроенным чатом жпт, чтобы они сами себя убирали?" },
          { name: "Одежда на стуле", descriptions: "> Шпиндель: Одежда захватила власть. Я бессилен." },
          { name: "Плакаты на стенах", descriptions: "> Шпиндель: Эти плакаты придают комнате вид.|> Шпиндель: больше всех мне нравится мерчовый плакат от моей любимой художницы и- |> Шпиндель: Кажется, я забыл, что хотел сказать." },
          { name: "Открытка С-Днём_Рождения!", descriptions: "> Шпиндель: Эту открытку мне прислал мой интернет друг.|> Шпиндель: Тут написано: 'Поздравляю, Шпиндель!  - от Всем0гущег0_Электр0фрезер0вщика228)'.|> Шпиндель: Хм. Приятно. Надеюсь на этой неделе мы снова будем играть в Лего Марвел!" },
          { name: "Шторы", descriptions: "> Шпиндель: Никакого света.|> Шпиндель: Ещё немного и мне придётся пить кровь и бояться чеснока." },
          { name: "Электрогитара", descriptions: "> Шпиндель: Насколько позорно будет звучать, что я приобрёл гитару, только чтобы научиться играть как Салли Фишер?.|> Шпиндель: Мне даже гитары не нравятся. Вот барабаны.." }
        ]
      }
    }
  })

  // КОРИДОР (использует файл corridor.jpg)
  await prisma.room.create({ 
    data: { 
      name: "Коридор", 
      description: "Коридор.", 
      image: "/images/corridor.jpg", // <--- ТУТ КОРИДОР
      items: { 
        create: [{ name: "Картина", descriptions: "> Шпиндель: Абстракция? Кубизм? Постмодернизм??|> Шпиндель: или я просто смотрю на жабий утёс?" }] 
      } 
    } 
  })
  
  // ЛЕСТНИЦА (использует файл stairs.jpg)
  await prisma.room.create({ 
    data: { 
      name: "Лестница", 
      description: "Лестница.", 
      image: "/images/stairs.jpg", // <--- ТУТ ЛЕСТНИЦА
      items: { create: [] } 
    } 
  })
  
  await prisma.room.create({ 
    data: { 
      name: "Кухня", 
      description: "Кухня.", 
      image: "/images/kitchen.jpg", 
      items: { create: [{ name: "Чайник", descriptions: "> Шпиндель: А у Сыендука был выпуск чинил про чайник или я путаю?" }] } 
    } 
  })
  
  await prisma.room.create({ 
    data: { 
      name: "Туалет", 
      description: "Туалет.", 
      image: "/images/toilet.jpg", 
      items: { create: [{ name: "Унитаз", descriptions: "> Шпиндель: Я же не буду всерьёз этого делать, да?|> Шпиндель:... |> Шпиндель: ПОЛУНДРА! " }] } 
    } 
  })
  
  await prisma.room.create({ 
    data: { 
      name: "Ванная", 
      description: "Ванная.", 
      image: "/images/bathroom.jpg", 
      items: { create: [{ name: "Зеркало", descriptions: "> Шпиндель: Это я.|> Шпиндель:... |> Шпиндель:Всё ещё я. |> Шпиндель:... |> Шпиндель: .......................|> Шпиндель: .....|> Шпиндель: Думаю,это до сих пор я. |> Шпиндель: ..." }] } 
    } 
  })

  // Стартовая реплика игры
  await prisma.dialogue.createMany({
    data: [{ trigger: "start", text: "> Шпиндель: А вот и моя комната." }]
  })

  // Персонаж — нужен компоненту для подстановки имени вместо «Шпиндель»
  await prisma.character.create({ data: { name: "Шпиндель" } })

  console.log("База обновлена! Спальня — полный набор предметов, персонаж создан.")
}

main().catch((e) => console.error(e)).finally(async () => await prisma.$disconnect())
