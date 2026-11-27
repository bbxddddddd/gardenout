"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// ============================================================
// ТИПЫ ДАННЫХ
// ============================================================

// Предмет: у каждого свой id, имя и набор реплик через разделитель "|"
type Item = { id: number; name: string; descriptions: string };
// Комната: id, название, описание, фоновая картинка и список предметов
type Room = { id: number; name: string; description: string; image: string; items: Item[] };
// Реплика диалога: срабатывает по триггеру (например "start")
type Dialogue = { id: number; trigger: string; text: string };

// ============================================================
// КАРТА ИГРЫ
// ============================================================

// Куда можно уйти из каждой комнаты
const roomConnections: Record<string, string[]> = {
  "Спальня": ["Коридор"],
  "Коридор": ["Спальня", "Туалет", "Ванная", "Лестница"],
  "Туалет": ["Коридор"],
  "Ванная": ["Коридор"],
  "Лестница": ["Коридор", "Кухня"],
  "Кухня": ["Лестница"]
};

// НАСТРОЙКИ ГЕРОЯ В КОМНАТАХ:
// x, y — позиция в процентах от размера комнаты,
// width — ширина спрайта героя в пикселях
const roomSettings: Record<string, { x: number, y: number, width: number }> = {
  "Спальня": { x: 15, y: 45, width: 70 },
  "Коридор": { x: 10, y: 45, width: 150 },
  "Кухня": { x: 10, y: 45, width: 130 },
  "Лестница": { x: 32, y: 15, width: 60 },
  "Туалет": { x: 25, y: 55, width: 190 },
  "Ванная": { x: 55, y: 55, width: 110 },
};

// НАСТРОЙКИ КАРТИНКИ НА ЭКРАНЕ КОНЦА (down.png)
// x, y      — позиция центра картинки в процентах от экрана (50/50 = центр)
// width     — ширина картинки в пикселях
// height    — высота картинки в пикселях (можно задать отдельно, если не хотите искажения — ставьте равной ширине)
// opacity   — прозрачность в % (0 = невидима, 100 = полностью непрозрачная)
const endImageSettings = {
  x: 50,       // Позиция по горизонтали (в %)
  y: 17,       // Позиция по вертикали (в %)
  width: 500,  // Ширина в пикселях
  height: 250, // Высота в пикселях
  opacity: 100  // Прозрачность (в %)
};


// Фразы, которые герой говорит при входе в комнату
const roomEnterTexts: Record<string, string> = {
  "Спальня": "моя неприступная крепость",
  "Коридор": "пора покинуть зону комфорта",
  "Лестница": "главное не навернуться",
  "Кухня": "газовой плиты нет.",
  "Ванная": "я не буду мыться.",
  "Туалет": "зона комфорта, но поменьше"
};

// Кадры анимации «смыва»: прокручиваются по кругу, пока isEscaping = true
const animationFrames = ["/images/1.png", "/images/2.png", "/images/3.png", "/images/four.png"];

// ============================================================
// ГЛАВНЫЙ КОМПОНЕНТ ИГРЫ
// ============================================================

export default function ComicGame({ rooms, dialogues, characterName }: { rooms: Room[], dialogues: Dialogue[], characterName: string }) {
  const [isClient, setIsClient] = useState(false); // Защита от SSR: рендерим игру только в браузере

  const [gameStarted, setGameStarted] = useState(false); // Старт игры пройден?
  const [loginStep, setLoginStep] = useState<1 | 2>(1);  // Шаг экрана входа: 1 — ввод имени, 2 — «Отказано»
  const [inputName, setInputName] = useState("");        // То, что игрок напечатал в поле

  // Стартовая комната — спальня, а если её нет, первая попавшаяся
  const startRoom = rooms.find(r => r.name === "Спальня") || rooms[0];
  const [currentRoom, setCurrentRoom] = useState<Room>(startRoom);
  // Первая реплика: диалог с триггером "start" или запасной текст
  const [log, setLog] = useState<string>(dialogues.find(d => d.trigger === "start")?.text || "Игра началась.");

  // Позиция и размер героя берутся из настроек текущей комнаты
  const settings = roomSettings[currentRoom.name] || { x: 50, y: 80, width: 200 };
  const [position, setPosition] = useState({ x: settings.x, y: settings.y });

  const [inventory, setInventory] = useState<string[]>([]);              // Подобранные предметы
  const [clickCounters, setClickCounters] = useState<Record<number, number>>({}); // Сколько раз кликнули по каждому предмету
  const [activeMenu, setActiveMenu] = useState<{ type: 'interact' | 'inventory' | 'travel', align: 'left' | 'right' } | null>(null); // Какое меню открыто
  const [activeItem, setActiveItem] = useState<Item | null>(null);       // Выбранный предмет (для клавиши E)

  const [isTalking, setIsTalking] = useState(false);                     // Герой сейчас «говорит» (меняется спрайт)
  const talkTimerRef = useRef<NodeJS.Timeout | null>(null);              // Таймер, чтобы спрайт закрыл рот через 2.5 сек

  const [isEscaping, setIsEscaping] = useState(false);                   // Идёт анимация смыва?
  const [animationFrame, setAnimationFrame] = useState(0);               // Номер текущего кадра анимации

  const [isGameOver, setIsGameOver] = useState(false);                   // Конец игры?

  // При монтировании включаем клиентский рендер (иначе Next.js ругается на гидратацию)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Подставляем имя персонажа вместо «Шпиндель» и «ГГ» в любом тексте
  const formatText = (text: string) => {
    return text.replace(/Шпиндель/g, characterName).replace(/> ГГ:/g, `> ${characterName}:`);
  };

  // При смене комнаты: герой встаёт на стартовую точку, все меню и состояния сбрасываются
  useEffect(() => {
    const newSettings = roomSettings[currentRoom.name] || { x: 50, y: 80, width: 200 };
    setPosition({ x: newSettings.x, y: newSettings.y });
    setActiveMenu(null);
    setActiveItem(null);
    setIsTalking(false);
    setIsEscaping(false);
  }, [currentRoom]);

  // Пока идёт анимация смыва — каждые 110 мс переключаем кадр по кругу
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isEscaping) {
      interval = setInterval(() => {
        setAnimationFrame(prev => (prev + 1) % animationFrames.length);
      }, 110);
    }
    return () => clearInterval(interval); // Останавливаем таймер, когда анимация закончилась
  }, [isEscaping]);

  // Показ реплики в логе: подставляем имя и на 2.5 сек включаем спрайт «говорит»
  const addLog = (text: string) => {
    setLog(formatText(text));
    setIsTalking(true);
    if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
    talkTimerRef.current = setTimeout(() => setIsTalking(false), 2500);
  };

  // Главная логика взаимодействия с предметом
  const handleInteract = (item: Item) => {
    if (isGameOver) return; // После конца игры клики игнорируются

    // Если во время анимации смыва трогают унитаз — это финал
    if (isEscaping && item.name === "Унитаз") {
      setIsGameOver(true);
      return;
    }

    setActiveItem(item);
    // Реплики предмета лежат одной строкой через "|", листаем их по клику по кругу
    const descriptionsArray = item.descriptions.split('|');
    const currentCount = clickCounters[item.id] || 0;
    const textToShow = descriptionsArray[currentCount % descriptionsArray.length];

    // На третьем клике по унитазу запускается анимация смыва
    if (item.name === "Унитаз" && currentCount === 2) {
      setIsEscaping(true);
      setAnimationFrame(0);
    }

    // Предметы, которые можно забрать в инвентарь
    const takeableItems = ["Очки-бинокуляры", "Открытка", "Носки", "Аптечка"];
    let finalLog = textToShow;

    // При первом взборе — реплика «предмет в кармане» + основная реплика предмета
    if (takeableItems.includes(item.name) && !inventory.includes(item.name)) {
      setInventory(prev => [...prev, item.name]);
      if (currentCount === 0) {
        finalLog = `> ${characterName}: Теперь ${item.name} у меня в кармане.\n\n${textToShow}`;
      }
    }

    addLog(finalLog);
    // Запоминаем, что по этому предмету кликнули ещё раз
    setClickCounters(prev => ({ ...prev, [item.id]: currentCount + 1 }));
  };

  // Управление с клавиатуры: WASD/стрелки — ходьба, E — листать реплики выбранного предмета
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) return;
      // Не двигаем героя, пока игрок печатает в поле ввода
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const step = 5; // Шаг героя в процентах за одно нажатие
      setPosition(prev => {
        let newX = prev.x, newY = prev.y;
        // Дублируем латиницу русскими клавишами (ЦФЫВ) и стрелками
        if (e.key === 'w' || e.key === 'W' || e.key === 'ц' || e.key === 'Ц' || e.key === 'ArrowUp') newY -= step;
        if (e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы' || e.key === 'ArrowDown') newY += step;
        if (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф' || e.key === 'ArrowLeft') newX -= step;
        if (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В' || e.key === 'ArrowRight') newX += step;
        // Не даём герою выйти за границы экрана
        return { x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) };
      });

      // E — то же самое, что клик по выбранному предмету
      if ((e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') && activeItem) {
        // Во время анимации смыва клавиша E по унитазу включает финал
        if (isEscaping && activeItem.name === "Унитаз") {
          setIsGameOver(true);
          return;
        }
        handleInteract(activeItem);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown); // Чистим слушатель при размонтировании
  }, [activeItem, clickCounters, inventory, gameStarted, characterName, isEscaping, isGameOver]);

  // Переход в соседнюю комнату + реплика при входе
  const handleMove = (roomName: string) => {
    if (isGameOver) return;
    const nextRoom = rooms.find(r => r.name === roomName);
    if (nextRoom) {
      setCurrentRoom(nextRoom);
      const phrase = roomEnterTexts[nextRoom.name] || `Перехожу в ${nextRoom.name}.`;
      addLog(`> ${characterName}: ${phrase}`);
    }
  };

  // До гидратации показываем пустой чёрный экран
  if (!isClient) {
    return <main className="min-h-screen bg-black" />;
  }

  // ==========================================
  // БЛОК 1: ЭКРАН ВВОДА ИМЕНИ
  // ==========================================
  if (!gameStarted) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-mono p-4">
        <div className="w-full max-w-lg bg-black border-2 border-white p-8 flex flex-col items-center">
          {loginStep === 1 ? (
            <>
              <h1 className="text-xl mb-6 uppercase tracking-widest text-center">Введите имя персонажа:</h1>
              <input 
                type="text" 
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full bg-black border-2 border-white p-2 text-white text-lg mb-6 outline-none focus:border-gray-400"
                placeholder="..."
              />
              <button onClick={() => setLoginStep(2)} className="px-6 py-2 border-2 border-white bg-black hover:bg-gray-800 uppercase tracking-widest">Сохранить</button>
            </>
          ) : (
            <>
              {/* Второй шаг: имя не принимается — система называет героя сама */}
              <h1 className="text-xl mb-6 text-center text-red-500 uppercase tracking-widest">
                Отказано.<br/><br/>Вашего персонажа зовут {characterName}.
              </h1>
              <button onClick={() => setGameStarted(true)} className="px-6 py-2 border-2 border-white bg-black hover:bg-gray-800 uppercase tracking-widest">Сохранить</button>
            </>
          )}
        </div>
      </main>
    );
  }

   // ==========================================
  // БЛОК 2: ЭКРАН КОНЦА ИГРЫ
  // ==========================================
  if (isGameOver) {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-black text-white font-mono p-4 overflow-hidden">

        {/* Картинка down.png — ЛЕЖИТ ПОВЕРХ ВСЕГО (z-20).
            Позиция, размер и прозрачность берутся из endImageSettings в начале файла.
            pointer-events-none — чтобы картинка не перекрывала клики по кнопке. */}
        <div 
          className="absolute z-20 pointer-events-none"
          style={{ 
            left: `${endImageSettings.x}%`, 
            top: `${endImageSettings.y}%`, 
            transform: 'translate(-50%, -50%)',
            opacity: `${endImageSettings.opacity}%`
          }}
        >
          <Image 
            src="/images/down.png" 
            alt="Фон" 
            width={endImageSettings.width} 
            height={endImageSettings.height} 
            unoptimized
            style={{ 
              width: `${endImageSettings.width}px`, 
              height: `${endImageSettings.height}px`, 
              imageRendering: 'pixelated' 
            }}
          />
        </div>

        {/* Текст и кнопка — теперь ПОД картинкой (z-10) */}
        <div className="relative z-10 w-full max-w-lg bg-black border-2 border-white p-8 flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-6 uppercase tracking-widest">
            Игра окончена!
          </h1>
          
          <p className="text-lg mb-4 text-white">
            Шпиндель смылся в унитаз.
          </p>
          
          <p className="text-sm text-gray-500 mb-8">
            (как это вообще получилось?)
          </p>

          {/* Перезагрузка страницы = новая игра */}
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 border-2 border-white bg-black hover:bg-gray-800 uppercase tracking-widest font-bold"
          >
            Начать заново
          </button>
        </div>
      </main>
    );
  }


  // ==========================================
  // БЛОК 3: ОСНОВНАЯ ИГРА
  // ==========================================
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-mono p-4">
      
      {/* Сцена с фоном текущей комнаты */}
      <div className="relative w-full max-w-5xl aspect-video bg-gray-800 rounded border-2 border-gray-600 mb-2 overflow-hidden">
         <Image src={currentRoom.image} alt={currentRoom.name} fill className="object-cover" />
         
         {/* Анимация смыва закрывает всю сцену, пока идёт */}
         {isEscaping && (
            <div className="absolute inset-0 z-20 w-full h-full">
              <Image 
                src={animationFrames[animationFrame]} 
                alt="Анимация" 
                fill 
                unoptimized 
                className="object-cover" 
                style={{ imageRendering: 'pixelated' }} 
              />
            </div>
         )}

         {/* Герой: прячется на время анимации, меняет спрайт, когда «говорит» */}
         {!isEscaping && (
           <div className="absolute z-10 transition-all duration-75 ease-out" 
                style={{ left: `${position.x}%`, top: `${position.y}%`, transform: 'translate(-50%, -50%)' }}>
              <Image 
                src={isTalking ? "/images/gg_talking.png" : "/images/gg_molchit.png"} 
                alt="Главный герой" 
                width={settings.width} 
                height={settings.width * 2} 
                style={{ width: `${settings.width}px`, height: 'auto', imageRendering: 'pixelated' }}
              />
           </div>
         )}
      </div>

      {/* Панель кнопок и всплывающие меню */}
      <div className="flex gap-2 w-full max-w-5xl mb-2 relative">
        <div className="flex-1 relative">
          <button onClick={() => setActiveMenu(activeMenu?.type === 'interact' ? null : { type: 'interact', align: 'left' })} className="w-full py-2 border-2 border-white bg-black hover:bg-gray-800 text-lg uppercase tracking-widest">Взаимодействие</button>
          {activeMenu?.type === 'interact' && (
            <div className="absolute top-full mt-2 left-0 w-72 bg-black border-2 border-white p-2 z-50 shadow-[5px_5px_0px_rgba(255,255,255,0.3)] max-h-64 overflow-y-auto">
              <div className="flex justify-between items-center mb-2 border-b border-gray-600 pb-1">
                <span className="text-sm text-gray-400 uppercase">Что осмотреть?</span>
                <button onClick={() => setActiveMenu(null)} className="text-red-500 font-bold hover:text-red-400">X</button>
              </div>
              <div className="flex flex-col gap-1">
                {/* Список предметов текущей комнаты; выбранный подсвечен зелёным */}
                {currentRoom.items.length > 0 ? currentRoom.items.map(item => (
                  <button key={item.id} onClick={() => { handleInteract(item); setActiveMenu(null); }} className={`text-left px-2 py-1 border text-sm transition-colors ${activeItem?.id === item.id ? 'bg-gray-800 border-green-500 text-green-400' : 'border-gray-600 hover:bg-gray-800'}`}>
                    {item.name}
                  </button>
                )) : <span className="text-sm text-gray-500 italic">Тут нечего трогать.</span>}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => setActiveMenu(activeMenu?.type === 'inventory' ? null : { type: 'inventory', align: 'right' })} className="flex-1 py-2 border-2 border-white bg-black hover:bg-gray-800 text-lg uppercase tracking-widest">Инвентарь</button>

        <div className="flex-1 relative">
          <button onClick={() => setActiveMenu(activeMenu?.type === 'travel' ? null : { type: 'travel', align: 'right' })} className="w-full py-2 border-2 border-white bg-black hover:bg-gray-800 text-lg uppercase tracking-widest">Отправиться...</button>
          {activeMenu?.type === 'travel' && (
            <div className="absolute top-full mt-2 right-0 w-64 bg-black border-2 border-white p-2 z-50 shadow-[-5px_5px_0px_rgba(255,255,255,0.3)]">
              <div className="flex justify-between items-center mb-2 border-b border-gray-600 pb-1">
                <span className="text-sm text-gray-400 uppercase">Куда идти?</span>
                <button onClick={() => setActiveMenu(null)} className="text-red-500 font-bold hover:text-red-400">X</button>
              </div>
              <div className="flex flex-col gap-1">
                {/* Только те комнаты, в которые из текущей можно перейти */}
                {roomConnections[currentRoom.name]?.map(roomName => (
                  <button key={roomName} onClick={() => { handleMove(roomName); setActiveMenu(null); }} className="text-left px-2 py-1 border border-gray-600 hover:bg-gray-800 text-sm">{roomName}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {activeMenu?.type === 'inventory' && (
          <div className="absolute top-full mt-2 right-1/3 w-64 bg-black border-2 border-white p-2 z-50 shadow-[-5px_5px_0px_rgba(255,255,255,0.3)]">
            <div className="flex justify-between items-center mb-2 border-b border-gray-600 pb-1">
              <span className="text-sm text-gray-400 uppercase">Инвентарь</span>
              <button onClick={() => setActiveMenu(null)} className="text-red-500 font-bold hover:text-red-400">X</button>
            </div>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {inventory.length > 0 ? inventory.map((item, i) => (
                <span key={i} className="px-2 py-1 border border-gray-600 bg-gray-900 text-sm">{item}</span>
              )) : <span className="text-sm text-gray-500 italic">Инвентарь пуст.</span>}
            </div>
          </div>
        )}
      </div>

      {/* Лог: текст реплик + подсказки по управлению в углу */}
      <div className="w-full max-w-5xl h-48 bg-black border-2 border-white p-4 text-lg overflow-y-auto relative">
        <p className="text-white whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: log }} />
        <div className="absolute bottom-2 right-4 text-xs text-gray-500 font-sans uppercase flex gap-4">
          <span>[WASD] Ходьба</span>
          <span className={activeItem ? "text-green-400 font-bold" : ""}>
            [E] {activeItem ? `Листать: ${activeItem.name}` : "Выберите предмет"}
          </span>
        </div>
      </div>
    </main>
  );
}
