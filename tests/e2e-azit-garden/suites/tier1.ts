import type { E2ETestCase } from '../types.js';
import { tier1FarmerTests } from './tier1-farmers.js';
import { tier1GardenTests } from './tier1-garden.js';
import { tier1PlatformTests } from './tier1-platform.js';

export const tier1Tests: E2ETestCase[] = [
  ...tier1GardenTests,
  ...tier1FarmerTests,
  ...tier1PlatformTests,
];
