import { LogLevel } from '../framework/live2dcubismframework';

export const ViewScale = 1.0;
export const ViewMaxScale = 2.0;
export const ViewMinScale = 0.8;

export const ViewLogicalLeft = -1.0;
export const ViewLogicalRight = 1.0;
export const ViewLogicalBottom = -1.0;
export const ViewLogicalTop = 1.0;

export const ViewLogicalMaxLeft = -2.0;
export const ViewLogicalMaxRight = 2.0;
export const ViewLogicalMaxBottom = -2.0;
export const ViewLogicalMaxTop = 2.0;

export let MotionGroupIdle = 'Idle';
export let MotionGroupTapBody = 'TapBody';

export let HitAreaNameHead = 'Head';
export let HitAreaNameBody = 'Body';

export function setInteractionConfig(config: {
  idleMotionGroup?: string;
  tapBodyMotionGroup?: string;
  headHitAreaName?: string;
  bodyHitAreaName?: string;
}) {
  if (config.idleMotionGroup) {
    MotionGroupIdle = config.idleMotionGroup;
  }
  if (config.tapBodyMotionGroup) {
    MotionGroupTapBody = config.tapBodyMotionGroup;
  }
  if (config.headHitAreaName) {
    HitAreaNameHead = config.headHitAreaName;
  }
  if (config.bodyHitAreaName) {
    HitAreaNameBody = config.bodyHitAreaName;
  }
}

export const PriorityNone = 0;
export const PriorityIdle = 1;
export const PriorityNormal = 2;
export const PriorityForce = 3;

export const MOCConsistencyValidationEnable = true;
export const MotionConsistencyValidationEnable = true;

export const DebugLogEnable = false;
export const DebugTouchLogEnable = false;

export const CubismLoggingLevel: LogLevel = LogLevel.LogLevel_Verbose;
