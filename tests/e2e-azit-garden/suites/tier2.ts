import type { E2ETestCase } from '../types.js';
import { tier2FarmerTests } from './tier2-farmers.js';
import { tier2GardenTests } from './tier2-garden.js';
import { tier2PlatformTests } from './tier2-platform.js';

export const tier2Tests: E2ETestCase[] = [
  ...tier2GardenTests,
  ...tier2FarmerTests,
  ...tier2PlatformTests,
];
