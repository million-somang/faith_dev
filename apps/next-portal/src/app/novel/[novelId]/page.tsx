import type { Metadata } from 'next';
import NovelClient from '@/components/novel/NovelClient';

interface NovelDetailPageProps {
  params: {
    novelId: string;
  };
}

export async function generateMetadata({ params }: NovelDetailPageProps): Promise<Metadata> {
  return {
    title: `웹소설 #${params.novelId} - 베라 웹소설 연재관`,
    description: '베라 웹소설 연재관에서 최신 화를 무료로 감상하세요.',
    alternates: {
      canonical: `https://veranex.app/entertainment/novel/${params.novelId}`,
    },
  };
}

export default function NovelIdRootPage({ params }: NovelDetailPageProps) {
  return <NovelClient initialNovelId={params.novelId} />;
}
