"use client";

import { useState } from "react";
import Image from "next/image";

const scenes = [
  { img: "/images/1.jpg", text: "Начало истории..." },
  { img: "/images/2.jpg", text: "Что-то происходит..." },
  { img: "/images/3.jpg", text: "Финал." }
];

export default function Home() {
  const [current, setCurrent] = useState(0);

  const nextScene = () => {
    if (current < scenes.length - 1) setCurrent(current + 1);
  };

  const prevScene = () => {
    if (current > 0) setCurrent(current - 1);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="max-w-2xl w-full flex flex-col items-center">
        
        {/* Картинка */}
        <div className="relative w-full h-96 mb-6">
          <Image
            src={scenes[current].img}
            alt={`Кадр ${current + 1}`}
            fill
            className="object-contain rounded-lg shadow-lg"
            priority
          />
        </div>

        {/* Текст */}
        <p className="text-xl mb-8 text-center min-h-[3rem]">
          {scenes[current].text}
        </p>

        {/* Кнопки */}
        <div className="flex gap-4">
          <button 
            onClick={prevScene}
            disabled={current === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            ← Назад
          </button>
          
          <button 
            onClick={nextScene}
            disabled={current === scenes.length - 1}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Вперёд →
          </button>
        </div>
        
      </div>
    </main>
  );
}