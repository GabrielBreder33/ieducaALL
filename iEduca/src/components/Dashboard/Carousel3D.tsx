import { useState, ReactNode } from 'react';

interface CarouselItem {
  id: number;
  content: ReactNode;
}

interface Carousel3DProps {
  items: CarouselItem[];
  initialIndex?: number;
}

export default function Carousel3D({ items, initialIndex = 0 }: Carousel3DProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentX(e.clientX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    const diff = currentX - startX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const diff = currentX - startX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    
    setIsDragging(false);
    setStartX(0);
    setCurrentX(0);
  };

  const getItemStyle = (index: number) => {
    let diff = index - currentIndex;
    const total = items.length;
    
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    
    const absPos = Math.abs(diff);
    
    if (absPos > 2) return { display: 'none' };
    
    let transform = '';
    let zIndex = 0;
    let opacity = 0;
    let scale = 1;
    
    if (diff === 0) {
      // Item central
      transform = 'translateX(0) translateZ(0) rotateY(0deg)';
      zIndex = 30;
      opacity = 1;
      scale = 1;
    } else if (diff === 1) {
      // Próximo à direita
      transform = 'translateX(110%) translateZ(-350px) rotateY(-35deg)';
      zIndex = 20;
      opacity = 0.4;
      scale = 0.7;
    } else if (diff === -1) {
      // Anterior à esquerda
      transform = 'translateX(-110%) translateZ(-350px) rotateY(35deg)';
      zIndex = 20;
      opacity = 0.4;
      scale = 0.7;
    } else if (diff === 2) {
      // Segundo à direita
      transform = 'translateX(180%) translateZ(-600px) rotateY(-45deg)';
      zIndex = 10;
      opacity = 0.15;
      scale = 0.5;
    } else if (diff === -2) {
      // Segundo à esquerda
      transform = 'translateX(-180%) translateZ(-600px) rotateY(45deg)';
      zIndex = 10;
      opacity = 0.15;
      scale = 0.5;
    }
    
    return {
      transform: `${transform} scale(${scale})`,
      zIndex,
      opacity,
      transition: isDragging ? 'none' : 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
    };
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ perspective: '1500px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className="absolute w-full max-w-md"
            style={getItemStyle(index)}
          >
            {item.content}
          </div>
        ))}
      </div>

      {/* Botões de navegação */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-white flex items-center justify-center hover:bg-slate-700 transition-all z-40 shadow-xl"
      >
        ←
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-white flex items-center justify-center hover:bg-slate-700 transition-all z-40 shadow-xl"
      >
        →
      </button>

      {/* Indicadores em loop - mostra apenas 5 dots circulares */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-40">
        {[-2, -1, 0, 1, 2].map((offset) => {
          const index = (currentIndex + offset + items.length) % items.length;
          const isCenter = offset === 0;
          
          return (
            <button
              key={offset}
              onClick={() => setCurrentIndex(index)}
              className={`rounded-full transition-all ${
                isCenter
                  ? 'bg-purple-500 w-8 h-2'
                  : offset === -1 || offset === 1
                  ? 'bg-slate-500 w-4 h-2'
                  : 'bg-slate-600 w-2 h-2'
              } hover:bg-purple-400`}
            />
          );
        })}
      </div>
    </div>
  );
}
