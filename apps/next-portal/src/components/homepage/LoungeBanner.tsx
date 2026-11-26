'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export interface LoungeTickerPost {
  id: number | string;
  author_name?: string;
  content: string;
  likes?: number;
  comments_count?: number;
}

interface LoungeBannerProps {
  initialPost?: LoungeTickerPost | null;
  hasInitialData?: boolean;
}

function summarizePostContent(content: string): string {
  const singleLine = content.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= 68) return singleLine;
  return `${singleLine.slice(0, 65)}...`;
}

export const LoungeBanner: React.FC<LoungeBannerProps> = ({
  initialPost,
  hasInitialData = false,
}) => {
  const [post, setPost] = useState<LoungeTickerPost | null>(initialPost ?? null);
  const [fetched, setFetched] = useState(hasInitialData || initialPost !== undefined);

  useEffect(() => {
    if (fetched) return;
    let active = true;

    fetch('/api/lounge/posts?limit=1')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const first = Array.isArray(data?.posts) ? data.posts[0] : null;
        if (first && first.content) {
          setPost({
            id: first.id,
            author_name: first.author_name,
            content: String(first.content),
            likes: Number(first.likes) || 0,
            comments_count: Number(first.comments_count) || 0,
          });
        }
      })
      .catch(() => {
        // 라운지 조회 실패 시 정직한 기본 안내 문구로 폴백
      })
      .finally(() => {
        if (active) setFetched(true);
      });

    return () => {
      active = false;
    };
  }, [fetched]);

  const headline = post?.content
    ? summarizePostContent(post.content)
    : 'VERA 라운지에서 실시간 이슈와 생활 노하우를 자유롭게 나눠보세요';

  return (
    <Link
      href="/lounge"
      className="flex items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-sm mb-4 sm:mb-5 border border-slate-800 hover:border-indigo-500/60 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="inline-flex items-center gap-1 bg-rose-500/90 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          <span>라운지 LIVE</span>
        </span>
        {post?.author_name && (
          <span className="hidden sm:inline text-xs font-bold text-indigo-200 shrink-0">
            {post.author_name}
          </span>
        )}
        <span className="text-xs sm:text-sm font-semibold tracking-tight text-slate-100 truncate min-w-0">
          {headline}
        </span>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {post && (
          <span className="hidden md:inline-flex items-center gap-2 text-[11px] text-slate-300 font-medium">
            <span>
              <i className="far fa-heart mr-1 text-rose-400"></i>
              {post.likes ?? 0}
            </span>
            <span>
              <i className="far fa-comment mr-1 text-sky-400"></i>
              {post.comments_count ?? 0}
            </span>
          </span>
        )}
        <span className="text-xs font-bold flex items-center gap-1 text-indigo-200 group-hover:text-white transition-colors">
          <span>더보기</span>
          <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
        </span>
      </div>
    </Link>
  );
};

export default LoungeBanner;
