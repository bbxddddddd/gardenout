"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Item = { id: number; name: string; descriptions: string };
type Room = { id: number; name: string; description: string; image: string; items: Item[] };
type Dialogue = { id: number; trigger: string; text: string };

const roomConnections: Record<string, string[]> = {
  "Спальня": ["Коридор"],
  "Коридор": ["Спальня", "Туалет", "Ванная", "Лестница"],
  "Туалет": ["Коридор"],
  "Ванная": ["Коридор"],
  "Лестница": ["Коридор", "Кухня"],
  "Кухня": ["Лестница"]
};

export default function ComicGame({ rooms, dialogues, characterName }: { rooms: Room[], dialogues: Dialogue[], characterName: string }) {
  // Добавляем проверку на клиент, чтобы избежать ошибки гидратации
  const [isClient, setIsClient] = useState(false);
  
  // --- СОСТОЯНИЯ ДЛЯ ЭКРАНА ВХОДА ---
  const [gameStarted, setGameStarted] = useState(false);
  const [loginStep, setLoginStep] = useState<1 | 2>(1);
  const [inputName, setInputName] = useState("");

  // --- ОСНОВНЫЕ СОСТОЯНИЯ ИГРЫ ---
  const startRoom = rooms.find(r => r.name === "Спальня") || rooms[0];
  const [currentRoom, setCurrentRoom] = useState<Room>(startRoom);
  const [log, setLog] = useState<string>(dialogues.find(d => d.trigger === "start")?.text || "Игра началась.");
  const [position, setPosition] = useState({ x: 50, y: 80 });
  const [inventory, setInventory] = useState<string[]>([]);
  const [clickCounters, setClickCounters] = useState<Record<number, number>>({});
  const [activeMenu, setActiveMenu] = useState<{ type: 'interact' | 'inventory' | 'travel', align: 'left' | 'right' } | null>(null);
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  // Устанавливаем isClient в true только после загрузки в браузере
  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatText = (text: string) => {
    return text.replace(/Шпиндель/g, characterName).replace(/> ГГ:/g, `> ${characterName}:`);
  };

  useEffect(() => {
    setPosition({ x: 50, y: 80 });
    setActiveMenu(null);
    setActiveItem(null);
  }, [currentRoom]);

  const addLog = (text: string) => setLog(formatText(text));

  const handleInteract = (item: Item) => {
    setActiveItem(item);
    const descriptionsArray = item.descriptions.split('|');
    const currentCount = clickCounters[item.id] || 0;
    const textToShow = descriptionsArray[currentCount % descriptionsArray.length];
    
    addLog(textToShow);
    
    setClickCounters(prev => ({ ...prev, [item.id]: currentCount + 1 }));

    const takeableItems = ["Очки-бинокуляры", "Открытка", "Носки", "Аптечка"];
    if (takeableItems.includes(item.name) && !inventory.includes(item.name)) {
      setInventory(prev => [...prev, item.name]);
      if (currentCount === 0) {
        setLog(prevLog => prevLog + `\n> ${characterName}: Теперь ${item.name} у меня в кармане.`);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const step = 5;
      setPosition(prev => {
        let newX = prev.x, newY = prev.y;
        if (e.key === 'w' || e.key === 'W' || e.key === 'ц' || e.key === 'Ц' || e.key === 'ArrowUp') newY -= step;
        if (e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы' || e.key === 'ArrowDown') newY += step;
        if (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф' || e.key === 'ArrowLeft') newX -= step;
        if (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В' || e.key === 'ArrowRight') newX += step;
        return { x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) };
      });

      if ((e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') && activeItem) {
        handleInteract(activeItem);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem, clickCounters, inventory, gameStarted, characterName]);

  const handleMove = (roomName: string) => {
    const nextRoom = rooms.find(r => r.name === roomName);
    if (nextRoom) {
      setCurrentRoom(nextRoom);
      addLog(`> ${characterName}: Перехожу в ${nextRoom.name}.`);
    }
  };

  // Если страница только загружается сервером, показываем пустой черный экран
  if (!isClient) {
    return <main className="min-h-screen bg-black" />;
  }

  // --- ЭКРАН ВХОДА (Ввод имени) ---
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
              <button 
                onClick={() => setLoginStep(2)}
                className="px-6 py-2 border-2 border-white bg-black hover:bg-gray-800 uppercase tracking-widest"
              >
                Сохранить
              </button>
            </>
          ) : (
            <>
              <h1 className="text-xl mb-6 text-center text-red-500 uppercase tracking-widest">
                Отказано.<br/><br/>
                Вашего персонажа зовут {characterName}.
              </h1>
              <button 
                onClick={() => setGameStarted(true)}
                className="px-6 py-2 border-2 border-white bg-black hover:bg-gray-800 uppercase tracking-widest"
              >
                Сохранить
              </button>
            </>
          )}

        </div>
      </main>
    );
  }

  // --- ОСНОВНАЯ ИГРА ---
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-mono p-4">
      
      <div className="relative w-full max-w-5xl aspect-video bg-gray-800 rounded border-2 border-gray-600 mb-2 overflow-hidden">
         <Image src={currentRoom.image} alt={currentRoom.name} fill className="object-cover" />
         <div 
           className="absolute z-10 transition-all duration-75 ease-out"
           style={{ left: `${position.x}%`, top: `${position.y}%`, transform: 'translate(-50%, -50%)' }}
         >
            <Image 
              src="/images/prototype_gg.png" 
              alt="Главный герой" 
              width={100} 
              height={150} 
              className="object-contain drop-shadow-lg w-auto h-auto max-h-[200px]" 
            />
         </div>
      </div>

      <div className="flex gap-2 w-full max-w-5xl mb-2 relative">
        <div className="flex-1 relative">
          <button 
            onClick={() => setActiveMenu(activeMenu?.type === 'interact' ? null : { type: 'interact', align: 'left' })}
            className="w-full py-2 border-2 border-white bg-black hover:bg-gray-800 text-lg uppercase tracking-widest"
          >
            Взаимодействие
          </button>
          {activeMenu?.type === 'interact' && (
            <div className="absolute top-full mt-2 left-0 w-72 bg-black border-2 border-white p-2 z-50 shadow-[5px_5px_0px_rgba(255,255,255,0.3)] max-h-64 overflow-y-auto">
              <div className="flex justify-between items-center mb-2 border-b border-gray-600 pb-1">
                <span className="text-sm text-gray-400 uppercase">Что осмотреть?</span>
                <button onClick={() => setActiveMenu(null)} className="text-red-500 font-bold hover:text-red-400">X</button>
              </div>
              <div className="flex flex-col gap-1">
                {currentRoom.items.length > 0 ? currentRoom.items.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => { handleInteract(item); setActiveMenu(null); }}
                    className={`text-left px-2 py-1 border text-sm transition-colors ${activeItem?.id === item.id ? 'bg-gray-800 border-green-500 text-green-400' : 'border-gray-600 hover:bg-gray-800'}`}
                  >
                    {item.name}
                  </button>
                )) : <span className="text-sm text-gray-500 italic">Тут нечего трогать.</span>}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => setActiveMenu(activeMenu?.type === 'inventory' ? null : { type: 'inventory', align: 'right' })}
          className="flex-1 py-2 border-2 border-white bg-black hover:bg-gray-800 text-lg uppercase tracking-widest"
        >
          Инвентарь
        </button>

        <div className="flex-1 relative">
          <button 
            onClick={() => setActiveMenu(activeMenu?.type === 'travel' ? null : { type: 'travel', align: 'right' })}
            className="w-full py-2 border-2 border-white bg-black hover:bg-gray-800 text-lg uppercase tracking-widest"
          >
            Отправиться...
          </button>
          {activeMenu?.type === 'travel' && (
            <div className="absolute top-full mt-2 right-0 w-64 bg-black border-2 border-white p-2 z-50 shadow-[-5px_5px_0px_rgba(255,255,255,0.3)]">
              <div className="flex justify-between items-center mb-2 border-b border-gray-600 pb-1">
                <span className="text-sm text-gray-400 uppercase">Куда идти?</span>
                <button onClick={() => setActiveMenu(null)} className="text-red-500 font-bold hover:text-red-400">X</button>
              </div>
              <div className="flex flex-col gap-1">
                {roomConnections[currentRoom.name]?.map(roomName => (
                  <button 
                    key={roomName}
                    onClick={() => { handleMove(roomName); setActiveMenu(null); }}
                    className="text-left px-2 py-1 border border-gray-600 hover:bg-gray-800 text-sm"
                  >
                    {roomName}
                  </button>
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

      <div className="w-full max-w-5xl h-48 bg-black border-2 border-white p-4 text-lg overflow-y-auto relative">
        <p className="text-white whitespace-pre-wrap">{log}</p>
        
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