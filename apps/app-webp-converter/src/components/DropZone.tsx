import React, { useRef } from 'react';
import type { ImageFileItem } from '../types/index';
import { formatBytes } from '../utils/webpConverter';

interface DropZoneProps {
    items: ImageFileItem[];
    onFilesSelected: (files: File[]) => void;
    onRemoveItem: (id: string) => void;
    onLoadSample: () => void;
}

export default function DropZone({ items, onFilesSelected, onRemoveItem, onLoadSample }: DropZoneProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesSelected(Array.from(e.dataTransfer.files));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div className="space-y-3">
            {/* 드롭존 컨테이너 */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center group"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            onFilesSelected(Array.from(e.target.files));
                        }
                    }}
                />

                <div className="w-14 h-14 rounded-2xl bg-white text-indigo-600 shadow-md flex items-center justify-center text-2xl mb-3 group-hover:scale-105 transition-transform">
                    <i className="fas fa-cloud-upload-alt"></i>
                </div>

                <h3 className="text-sm font-black text-slate-800 mb-1">
                    이미지 파일을 드래그하거나 클릭하여 선택
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                    JPG, PNG, GIF, WebP 다중 파일 지원 (최대 50MB)
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 shadow-2xs">
                        <i className="fas fa-lock text-emerald-500 mr-1"></i>서버 전송 $0 로컬 처리
                    </span>
                    <button
                        type="button"
                        data-screenshot-click="action"
                        onClick={(e) => {
                            e.stopPropagation();
                            onLoadSample();
                        }}
                        className="text-[10px] font-black px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer"
                    >
                        샘플 이미지로 테스트 ✨
                    </button>
                </div>
            </div>

            {/* 선택된 파일 목록 칩 */}
            {items.length > 0 && (
                <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                        <span>선택된 파일 ({items.length}개)</span>
                        <span className="text-[11px] text-indigo-600">
                            총 {formatBytes(items.reduce((acc, cur) => acc + cur.originalSize, 0))}
                        </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                            >
                                <div className="flex items-center gap-2 truncate pr-2">
                                    <img
                                        src={item.previewUrl}
                                        alt={item.name}
                                        className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
                                    />
                                    <div className="truncate text-left">
                                        <div className="font-bold text-slate-800 truncate">{item.name}</div>
                                        <div className="text-[10px] text-slate-400">
                                            {formatBytes(item.originalSize)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onRemoveItem(item.id)}
                                    className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-rose-100 hover:text-rose-600 text-slate-500 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                                    title="삭제"
                                >
                                    <i className="fas fa-times text-[10px]"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
