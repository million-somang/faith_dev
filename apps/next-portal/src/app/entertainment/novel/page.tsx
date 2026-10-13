import type { Metadata } from 'next';
import NovelClient from '@/components/novel/NovelClient';

export const metadata: Metadata = {
  title: '베라 웹소설 연재관 - 자가 출판 & 자유 연재 플랫폼',
  description: '판타지, 무협, 로맨스, 현대판타지 등 다양한 장르의 웹소설을 무료로 감상하고 작가로서 직접 작품을 연재해보세요.',
  keywords: ['웹소설', '웹소설연재', '판타지소설', '무협소설', '로맨스소설', '웹소설작가', 'VERA'],
  alternates: {
    canonical: 'https://veranex.app/entertainment/novel',
  },
};

export default function NovelPage() {
  return <NovelClient />;
}
