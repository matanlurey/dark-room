export type Action =
  | 'doNothing'
  | 'moveForward'
  | 'moveBackward'
  | 'turnLeft'
  | 'turnRight'
  | 'standUp'
  | 'crouchDown'
  | 'reachForward';

export type GameElement = 'door';

export interface GameState {
  readonly isStanding: boolean;
  readonly roundsRemaining: number;
  readonly selectedAction?: Action;
  readonly timelineEvents?: string[][];
}

export type Item = 'key';
