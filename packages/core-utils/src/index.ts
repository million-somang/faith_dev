export * from './news.js';
export * from './stock.js';
export * from './formatter.js';
export * from './i18n.js';

export const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
