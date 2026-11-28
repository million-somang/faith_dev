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
azitGameRoutes.post('/api/azit-game/garden/unlock-plot', (c) => AzitGameController.unlockPlot(c));
azitGameRoutes.post('/api/azit-game/garden/fertilizer/buy', (c) => AzitGameController.buyFertilizer(c));
azitGameRoutes.post('/api/azit-game/garden/fertilize', (c) => AzitGameController.fertilizePlot(c));
azitGameRoutes.post('/api/azit-game/garden/upgrade-soil', (c) => AzitGameController.upgradeSoil(c));
azitGameRoutes.post('/api/azit-game/garden/water-all', (c) => AzitGameController.waterAll(c));
azitGameRoutes.post('/api/azit-game/garden/harvest-all', (c) => AzitGameController.harvestAll(c));
azitGameRoutes.post('/api/azit-game/garden/plant-all', (c) => AzitGameController.plantAll(c));

azitGameRoutes.post('/api/azit-game/farmers/hire', (c) => AzitGameController.hireFarmer(c));
azitGameRoutes.post('/api/azit-game/farmers/upgrade', (c) => AzitGameController.upgradeFarmer(c));
azitGameRoutes.post('/api/azit-game/farmers/config', (c) => AzitGameController.configureFarmer(c));

azitGameRoutes.post('/api/azit-game/crops/sell', (c) => AzitGameController.sellCrop(c));

azitGameRoutes.post('/api/azit-game/chefs/hire', (c) => AzitGameController.hireChef(c));
azitGameRoutes.post('/api/azit-game/chefs/upgrade', (c) => AzitGameController.upgradeChef(c));
azitGameRoutes.post('/api/azit-game/kitchen/start', (c) => AzitGameController.startCooking(c));
azitGameRoutes.post('/api/azit-game/kitchen/claim', (c) => AzitGameController.claimCooking(c));
azitGameRoutes.post('/api/azit-game/dishes/sell', (c) => AzitGameController.sellDish(c));

azitGameRoutes.post('/api/azit-game/mercenaries/hire', (c) => AzitGameController.hireMercenary(c));
azitGameRoutes.post('/api/azit-game/mercenaries/upgrade', (c) => AzitGameController.upgradeMercenary(c));
azitGameRoutes.post('/api/azit-game/mercenaries/revive', (c) => AzitGameController.reviveMercenary(c));
azitGameRoutes.post('/api/azit-game/mercenaries/skills/upgrade', (c) => AzitGameController.upgradeMercSkill(c));
azitGameRoutes.post('/api/azit-game/groups/save', (c) => AzitGameController.saveGroup(c));
azitGameRoutes.post('/api/azit-game/groups/delete', (c) => AzitGameController.deleteGroup(c));
azitGameRoutes.post('/api/azit-game/expeditions/start', (c) => AzitGameController.startExpedition(c));
azitGameRoutes.post('/api/azit-game/expeditions/claim', (c) => AzitGameController.claimExpedition(c));
azitGameRoutes.post('/api/azit-game/shop/buy', (c) => AzitGameController.buyShopItem(c));
azitGameRoutes.post('/api/azit-game/craft', (c) => AzitGameController.craftItem(c));
azitGameRoutes.get('/api/azit-game/tower/floors', (c) => AzitGameController.getTowerFloors(c));
azitGameRoutes.post('/api/azit-game/tower/battle', (c) => AzitGameController.battleTowerFloor(c));
