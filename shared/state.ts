export type Action =
  | 'doNothing'
  | 'moveForward'
  | 'moveBackward'
  | 'turnLeft'
  | 'turnRight';

export interface GameState {
  readonly isStanding: boolean;
  readonly roundsRemaining: number;
  readonly selectedAction?: Action;
  readonly timelineEvents?: string[][];
}

export type Item = 'key';
