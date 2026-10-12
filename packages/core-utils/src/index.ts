export * from './news';
export * from './stock';
export * from './formatter';
export * from './i18n';

export const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
