import React from 'react';
import { notFound } from 'next/navigation';
import { GAMES_DATA } from '@/data/gamesData';
import { ModalContainer } from '@/components/modal/ModalContainer';
import { ToolViewer } from '@/components/tools/ToolViewer';

interface GameModalProps {
  params: {
    slug: string;
  };
}

export default function GameModal({ params }: GameModalProps) {
  const game = GAMES_DATA[params.slug];
  if (!game) notFound();

  return (
    <ModalContainer
      title={game.name}
      categoryLabel={game.categoryLabel}
      icon={game.icon}
    >
      <ToolViewer item={game} isStandalone={false} />
    </ModalContainer>
  );
}
