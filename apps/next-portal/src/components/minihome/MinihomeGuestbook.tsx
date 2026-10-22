'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MinihomeGuestbookEntry } from '@/types/minihome.types';
import { getCatalogItemById, QUICK_ILCHON_MESSAGES } from '@/data/minihomeCatalogData';

interface MinihomeGuestbookProps {
    entries: MinihomeGuestbookEntry[];
    isOwner: boolean;
    ownerName: string;
    onAddEntry: (content: string) => Promise<boolean>;
    onReplyEntry: (entryId: number, replyText: string) => Promise<boolean>;
    onDeleteEntry: (entryId: number) => Promise<boolean>;
}

function getMinimiBadgeEmoji(minimiId: string): string {
    switch (minimiId) {
        case 'minimi-hoodie':
            return '🎧';
        case 'minimi-ceo':
            return '👔';
        case 'minimi-astronaut':
            return '🧑‍🚀';
        case 'minimi-hanbok':
            return '🎩';
        case 'minimi-wizard':
            return '🧙';
        case 'minimi-champion':
            return '👑';
        default:
            return '😊';
    }
}

export const MinihomeGuestbook: React.FC<MinihomeGuestbookProps> = ({
    entries,
    isOwner,
    ownerName,
    onAddEntry,
    onReplyEntry,
    onDeleteEntry,
}) => {
    const [newContent, setNewContent] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [replyingId, setReplyingId] = useState<number | null>(null);
    const [replyDraft, setReplyDraft] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContent.trim() || isSubmitting) return;
        setIsSubmitting(true);
        const ok = await onAddEntry(newContent);
        if (ok) {
            setNewContent('');
        }
        setIsSubmitting(false);
    };

    const handleQuickPhrase = (phrase: string) => {
        setNewContent(phrase);
    };

    const handleReplySubmit = async (entryId: number) => {
        if (!replyDraft.trim()) return;
        const ok = await onReplyEntry(entryId, replyDraft);
        if (ok) {
            setReplyingId(null);
            setReplyDraft('');
        }
    };

    return (
        <section
            aria-label="아지트 방문자 방명록"
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5"
        >
            {/* 헤더 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-base border border-indigo-100">
                        <i className="fas fa-book-open"></i>
                    </span>
                    <div>
                        <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                            아지트 방명록 ({entries.length})
                        </h2>
                        <p className="text-xs text-slate-500">
                            {ownerName}님의 아지트에 따뜻한 응원이나 인사말을 남겨보세요!
                        </p>
                    </div>
                </div>
            </div>

            {/* 빠른 응원 스티커 문구 칩 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] font-black text-indigo-600 shrink-0 mr-1">
                    ✨ 빠른 인사말:
                </span>
                {QUICK_ILCHON_MESSAGES.map((msg, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickPhrase(msg)}
                        className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] font-bold whitespace-nowrap transition-colors border border-slate-200/70 cursor-pointer"
                    >
                        {msg}
                    </button>
                ))}
            </div>

            {/* 방명록 입력 폼 */}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <input
                    type="text"
                    maxLength={250}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    data-screenshot-input="우와 아지트가 정말 아늑해요! 발도장 꾹 남기고 갑니다 ✨"
                    aria-label="아지트 방명록 입력"
                    placeholder="아지트 방명록 인사말을 남겨보세요... (최대 250자)"
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <button
                    type="submit"
                    disabled={isSubmitting || !newContent.trim()}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                    {isSubmitting ? '등록 중...' : '💌 방명록 남기기'}
                </button>
            </form>

            {/* 방명록 리스트 */}
            <div className="space-y-3">
                {entries.length === 0 ? (
                    <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-semibold">
                        아직 남겨진 방명록이 없습니다. 첫 번째 방명록의 주인공이 되어보세요!
                    </div>
                ) : (
                    entries.map((entry) => (
                        <article
                            key={entry.id}
                            className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-indigo-200/80 transition-all space-y-2.5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <Link
                                        href={`/minihome/${encodeURIComponent(entry.authorHandle)}`}
                                        title={`${entry.authorName}님의 아지트 놀러가기`}
                                        className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-1 shadow-2xs hover:scale-105 transition-transform shrink-0 overflow-hidden"
                                    >
                                        <img
                                            src={
                                                getCatalogItemById(entry.authorMinimiId)?.spriteUrl ||
                                                '/images/minihome/items/minimi-casual.png'
                                            }
                                            alt={entry.authorName}
                                            className="w-full h-full object-contain"
                                            loading="lazy"
                                        />
                                    </Link>
                                    <div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Link
                                                href={`/minihome/${encodeURIComponent(entry.authorHandle)}`}
                                                className="text-xs sm:text-sm font-black text-slate-900 hover:text-indigo-600 transition-colors"
                                            >
                                                {entry.authorName}
                                            </Link>
                                            <Link
                                                href={`/minihome/${encodeURIComponent(entry.authorHandle)}`}
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                            >
                                                🏠 아지트 방문
                                            </Link>
                                            <span className="text-[11px] text-slate-400 font-mono">
                                                {new Date(entry.createdAt).toLocaleDateString('ko-KR')}
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-1 leading-relaxed">
                                            {entry.content}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {isOwner && !entry.ownerReply && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReplyingId(replyingId === entry.id ? null : entry.id);
                                                setReplyDraft('');
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
                                        >
                                            답글
                                        </button>
                                    )}
                                    {(isOwner || entry.isMine) && (
                                        <button
                                            type="button"
                                            onClick={() => onDeleteEntry(entry.id)}
                                            aria-label="방명록 숨김 삭제"
                                            className="px-2 py-1 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
                                        >
                                            삭제
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 방 주인 답글 표시 */}
                            {entry.ownerReply && (
                                <div className="ml-8 sm:ml-12 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2">
                                    <span className="text-xs font-black text-indigo-600 shrink-0">
                                        ↳ 방주인 답글:
                                    </span>
                                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                        {entry.ownerReply}
                                    </p>
                                </div>
                            )}

                            {/* 답글 작성 폼 */}
                            {isOwner && replyingId === entry.id && (
                                <div className="ml-8 sm:ml-12 pt-1 flex items-center gap-2">
                                    <input
                                        type="text"
                                        maxLength={150}
                                        value={replyDraft}
                                        onChange={(e) => setReplyDraft(e.target.value)}
                                        placeholder="방문자에게 고마운 답글을 남겨보세요..."
                                        className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleReplySubmit(entry.id)}
                                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                                    >
                                        답글 등록
                                    </button>
                                </div>
                            )}
                        </article>
                    ))
                )}
            </div>
        </section>
    );
};
