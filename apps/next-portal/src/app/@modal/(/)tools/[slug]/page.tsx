import React from 'react';
import { notFound } from 'next/navigation';
import { getToolBySlug } from '@/data/toolsData';
import { ModalContainer } from '@/components/modal/ModalContainer';
import { ToolViewer } from '@/components/tools/ToolViewer';

interface ToolModalProps {
  params: {
    slug: string;
  };
}

export default function ToolModal({ params }: ToolModalProps) {
  const tool = getToolBySlug(params.slug);
  if (!tool) notFound();

  return (
    <ModalContainer
      title={tool.name}
      categoryLabel={tool.categoryLabel}
      icon={tool.icon}
    >
      <ToolViewer item={tool} isStandalone={false} />
    </ModalContainer>
  );
}
