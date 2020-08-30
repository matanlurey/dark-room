export type Action =
  | 'doNothing'
  | 'moveForward'
  | 'moveBackward'
  | 'turnLeft'
  | 'turnRight';

export interface GameState {
  readonly roundsRemaining: number;
  readonly selectedAction?: Action;
  readonly timelineEvents?: string[][];
}
