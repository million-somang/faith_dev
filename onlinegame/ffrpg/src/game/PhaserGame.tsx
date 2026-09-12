import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config';

export const PhaserGame: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameRef.current && containerRef.current) {
      const config = createGameConfig('phaser-game-container');
      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      id="phaser-game-container" 
      ref={containerRef}
      className="w-full h-[380px] bg-slate-950 rounded-b-2xl overflow-hidden shadow-inner flex items-center justify-center relative"
    />
  );
};
