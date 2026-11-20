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

export default function ComicGame({ rooms, dialogues }: { rooms: Room[], dialogues: Dialogue[] }) {
  const startRoom = rooms.find(r => r.name === "Спальня") || rooms[0];
  
  const [currentRoom, setCurrentRoom] = useState<Room>(startRoom);
  const [log, setLog] = useState<string>(dialogues.find(d => d.trigger === "start")?.text || "Игра началась.");
  const [position, setPosition] = useState({ x: 50, y: 80 });
  
  const [inventory, setInventory] = useState<string[]>([]);
  const [clickCounters, setClickCounters] = useState<Record<number, number>>({});
  const [activeMenu, setActiveMenu] = useState<{ type: 'interact' | 'inventory' | 'travel', align: 'left' | 'right' } | null>(null);

  useEffect(() => {
    setPosition({ x: 50, y: 80 });
    setActiveMenu(null);
  }, [currentRoom]);

  const addLog = (text: string) => setLog(text);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const step = 5;
      setPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;

        if (e.key === 'w' || e.key === 'W' || e.key === 'ц' || e.key === 'Ц' || e.key === 'ArrowUp') newY -= step;
        if (e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы' || e.key === 'ArrowDown') newY += step;
        if (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф' || e.key === 'ArrowLeft') newX -= step;
        if (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В' || e.key === 'ArrowRight') newX += step;

        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));

        return { x: newX, y: newY };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMove = (roomName: string) => {
    const nextRoom = rooms.find(r => r.name === roomName);
    if (nextRoom) {
      setCurrentRoom(nextRoom);
      addLog(`> Шпиндель: Перехожу в ${nextRoom.name}.`);
    }
  };

  // Обработка клика по предмету
  const handleInteract = (item: Item) => {
    const descriptionsArray = item.descriptions.split('|');
    const currentCount = clickCounters[item.id] || 0;
    const textToShow = descriptionsArray[currentCount % descriptionsArray.length];
    
    addLog(textToShow);
    
    setClickCounters(prev => ({
      ...prev,
      [item.id]: currentCount + 1
    }));

    const takeableItems = ["Очки-бинокуляры", "Открытка", "Носки", "Аптечка"];
    if (takeableItems.includes(item.name) && !inventory.includes(item.name)) {
      setInventory(prev => [...prev, item.name]);
      if (currentCount === 0) {
        // Добавляем в конец текущего лога (можно просто перезаписать или дописать)
        setLog(prevLog => prevLog + `\n> Шпиндель: Теперь ${item.name} у меня в кармане.`);
      }
    }
    
    setActiveMenu(null);
  };

  const toggleMenu = (type: 'interact' | 'inventory' | 'travel') => {
    if (activeMenu?.type === type) {
      setActiveMenu(null);
    } else {
      setActiveMenu({ type, align: type === 'interact' ? 'left' : 'right' });
    }
  };

  const availableRooms = roomConnections[currentRoom.name] || [];

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-mono p-4">
      
      {/* Экран игры */}
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

      {/* Панель с кнопками */}
      <div className="flex gap-2 w-full max-w-5xl mb-2 relative">
        
        {/* Левая часть (Взаимодействие) */}
        <div className="flex-1 relative">
          <button 
            onClick={() => toggleMenu('interact')}
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
                    onClick={() => handleInteract(item)}
                    className="text-left px-2 py-1 border border-gray-600 hover:bg-gray-800 text-sm"
                  >
                    {item.name}
                  </button>
                )) : <span className="text-sm text-gray-500 italic">Тут нечего трогать.</span>}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => toggleMenu('inventory')}
          className="flex-1 py-2 border-2 border-white bg-black hover:bg-gray-800 text-lg uppercase tracking-widest"
        >
          Инвентарь
        </button>

        {/* Правая часть (Отправиться) */}
        <div className="flex-1 relative">
          <button 
            onClick={() => toggleMenu('travel')}
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
                {availableRooms.map(roomName => (
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
        
        {/* Меню Инвентаря */}
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

      {/* Лог */}
      <div className="w-full max-w-5xl h-48 bg-black border-2 border-white p-4 text-lg overflow-y-auto">
        <p className="text-white whitespace-pre-wrap">{log}</p>
      </div>
      
    </main>
  );
}