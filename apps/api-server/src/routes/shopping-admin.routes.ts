import { Hono } from 'hono';
import { requireAdmin } from './admin.routes.js';
import { ShoppingAdminController } from '../controllers/shopping-admin.controller.js';

export const shoppingAdminRoutes = new Hono<{ Variables: { adminUserId: string } }>();

shoppingAdminRoutes.use('/api/admin/shopping/*', requireAdmin);

// API 키 설정 및 연결 테스트
shoppingAdminRoutes.get('/api/admin/shopping/settings', (c) => ShoppingAdminController.getSettings(c));
shoppingAdminRoutes.put('/api/admin/shopping/settings', (c) => ShoppingAdminController.saveSettings(c));
shoppingAdminRoutes.post('/api/admin/shopping/settings/test', (c) => ShoppingAdminController.testConnection(c));

// 쿠팡 파트너스 Open API 조회 (검색 / 카테고리 베스트 / 골드박스 / 딥링크 변환)
shoppingAdminRoutes.get('/api/admin/shopping/coupang/search', (c) => ShoppingAdminController.searchCoupang(c));
shoppingAdminRoutes.get('/api/admin/shopping/coupang/best', (c) => ShoppingAdminController.bestCoupang(c));
shoppingAdminRoutes.get('/api/admin/shopping/coupang/goldbox', (c) => ShoppingAdminController.goldboxCoupang(c));
shoppingAdminRoutes.post('/api/admin/shopping/coupang/deeplink', (c) => ShoppingAdminController.createDeepLink(c));

// 쇼핑몰 상품 DB 등록 및 큐레이션 관리 (Soft Delete 전용)
shoppingAdminRoutes.post('/api/admin/shopping/products/import', (c) => ShoppingAdminController.importProducts(c));
shoppingAdminRoutes.post('/api/admin/shopping/products/manual', (c) => ShoppingAdminController.createManualProduct(c));
shoppingAdminRoutes.get('/api/admin/shopping/products', (c) => ShoppingAdminController.listProducts(c));
shoppingAdminRoutes.put('/api/admin/shopping/products/:id', (c) => ShoppingAdminController.updateProduct(c));
shoppingAdminRoutes.put('/api/admin/shopping/products/:id/status', (c) => ShoppingAdminController.toggleStatus(c));
shoppingAdminRoutes.post('/api/admin/shopping/products/:id/delete', (c) => ShoppingAdminController.softDeleteProduct(c));
