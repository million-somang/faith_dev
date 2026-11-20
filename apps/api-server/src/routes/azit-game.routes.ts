import { Hono } from 'hono';
import { requireAuth, type SessionUser } from '../middleware/auth.js';
import { AzitGameController } from '../controllers/azit-game.controller.js';

export const azitGameRoutes = new Hono<{ Variables: { user: SessionUser } }>();

azitGameRoutes.use('/api/azit-game/*', requireAuth);

azitGameRoutes.get('/api/azit-game/state', (c) => AzitGameController.getState(c));

azitGameRoutes.post('/api/azit-game/garden/buy-seed', (c) => AzitGameController.buySeed(c));
azitGameRoutes.post('/api/azit-game/garden/plant', (c) => AzitGameController.plantCrop(c));
azitGameRoutes.post('/api/azit-game/garden/water', (c) => AzitGameController.waterPlot(c));
azitGameRoutes.post('/api/azit-game/garden/harvest', (c) => AzitGameController.harvestPlot(c));
azitGameRoutes.post('/api/azit-game/garden/clear', (c) => AzitGameController.clearPlot(c));

azitGameRoutes.post('/api/azit-game/crops/sell', (c) => AzitGameController.sellCrop(c));

azitGameRoutes.post('/api/azit-game/chefs/hire', (c) => AzitGameController.hireChef(c));
azitGameRoutes.post('/api/azit-game/chefs/upgrade', (c) => AzitGameController.upgradeChef(c));
azitGameRoutes.post('/api/azit-game/kitchen/start', (c) => AzitGameController.startCooking(c));
azitGameRoutes.post('/api/azit-game/kitchen/claim', (c) => AzitGameController.claimCooking(c));
azitGameRoutes.post('/api/azit-game/dishes/sell', (c) => AzitGameController.sellDish(c));

azitGameRoutes.post('/api/azit-game/mercenaries/hire', (c) => AzitGameController.hireMercenary(c));
azitGameRoutes.post('/api/azit-game/mercenaries/upgrade', (c) => AzitGameController.upgradeMercenary(c));
azitGameRoutes.post('/api/azit-game/expeditions/start', (c) => AzitGameController.startExpedition(c));
azitGameRoutes.post('/api/azit-game/expeditions/claim', (c) => AzitGameController.claimExpedition(c));
