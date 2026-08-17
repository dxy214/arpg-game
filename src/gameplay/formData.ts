import type { PlayerForm } from './types';

export interface FormDefinition {
  label: string;
  moveSpeed: number;
  acceleration: number;
  turnSpeed: number;
  damageTaken: number;
  resourceRegen: number;
  dashCost: number;
  dashCooldown: number;
  dashDistance: number;
  dashDuration: number;
  primaryCost: number;
  secondaryCost: number;
  secondaryCooldown: number;
}

export const FORM_DEFINITIONS: Readonly<Record<PlayerForm, FormDefinition>> = {
  nightbound: {
    label: 'Nightbound', moveSpeed: 6.1, acceleration: 20, turnSpeed: 18,
    damageTaken: 1, resourceRegen: 13, dashCost: 12, dashCooldown: 0.65,
    dashDistance: 5.1, dashDuration: 0.22, primaryCost: 0,
    secondaryCost: 20, secondaryCooldown: 2.5,
  },
  wraith: {
    label: 'Wraith', moveSpeed: 7.15, acceleration: 25, turnSpeed: 22,
    damageTaken: 1.12, resourceRegen: 11, dashCost: 17, dashCooldown: 0.9,
    dashDistance: 7.4, dashDuration: 0.27, primaryCost: 4,
    secondaryCost: 28, secondaryCooldown: 4.4,
  },
  dreadwolf: {
    label: 'Dreadwolf', moveSpeed: 9.25, acceleration: 30, turnSpeed: 24,
    damageTaken: 1.08, resourceRegen: 16, dashCost: 15, dashCooldown: 1.0,
    dashDistance: 8.1, dashDuration: 0.3, primaryCost: 0,
    secondaryCost: 24, secondaryCooldown: 3.5,
  },
  stonewrought: {
    label: 'Stonewrought', moveSpeed: 4.45, acceleration: 14, turnSpeed: 11,
    damageTaken: 0.52, resourceRegen: 9, dashCost: 20, dashCooldown: 1.45,
    dashDistance: 3.5, dashDuration: 0.32, primaryCost: 0,
    secondaryCost: 34, secondaryCooldown: 5.4,
  },
};

