export * from './news.js';
export * from './stock.js';
export * from './formatter.js';
export const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
