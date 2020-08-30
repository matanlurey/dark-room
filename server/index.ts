import { Action } from '../shared/state';
import IO from 'socket.io';
import Prando from 'prando';

type Direction = 'north' | 'east' | 'south' | 'west';
type Injuries = 'nothing' | 'disoriented' | 'tripped';

/**
 * Represents a player in the game.
 */
class Player {
  private readonly events: string[][] = [];
  direction: Direction = 'north';

  constructor(readonly name: string, readonly socket: IO.Socket) {}

  startEvents(...events: string[]): void {
    this.events.push(events);
  }

  recordEvents(...events: string[]): void {
    this.events[this.events.length - 1].push(...events);
  }

  sendFullSync(args: {
    roundsRemaining: number;
    selectedAction?: Action;
  }): void {
    this.socket.emit('FULL_SYNC', { ...args, timelineEvents: this.events });
  }

  turnLeft(): void {
    switch (this.direction) {
      case 'north':
        this.direction = 'west';
        break;
      case 'east':
        this.direction = 'north';
        break;
      case 'south':
        this.direction = 'east';
        break;
      case 'west':
        this.direction = 'south';
        break;
    }
  }

  turnRight(): void {
    switch (this.direction) {
      case 'north':
        this.direction = 'east';
        break;
      case 'east':
        this.direction = 'south';
        break;
      case 'south':
        this.direction = 'west';
        break;
      case 'west':
        this.direction = 'north';
        break;
    }
  }
}

class Space {
  player?: Player;
}

/**
 * Represents room data.
 */
class Room {
  private readonly spaces: Space[][];

  constructor(width: number, height: number, private readonly rng: Prando) {
    const spaces = (this.spaces = new Array(height));
    for (let i = 0; i < spaces.length; i++) {
      spaces[i] = Array.from(Array(width), (_) => new Space());
    }
  }

  private emptySpaces(nextTo?: Player): [number, number][] {
    const results: [number, number][] = [];
    if (!nextTo) {
      for (let y = 0; y < this.spaces.length; y++) {
        for (let x = 0; x < this.spaces[y].length; x++) {
          const space = this.spaces[y][x];
          if (!space.player) {
            results.push([x, y]);
          }
        }
      }
    } else {
      let point = this.findPlayer(nextTo)!;
      [
        [point[0] + 1, point[1] + 0],
        [point[0] + 0, point[1] + 1],
        [point[0] - 1, point[1] + 0],
        [point[0] + 0, point[1] - 1],
      ].forEach((adjacent) => {
        if (this.findSpace(adjacent[0], adjacent[1])) {
          results.push([adjacent[0], adjacent[1]]);
        }
      });
    }
    return results;
  }

  computeSpace(
    x: number,
    y: number,
    d: Direction,
    forward: boolean,
  ): [number, number] {
    let modX = 0;
    let modY = 0;
    switch (d) {
      case 'north':
        modX = -1;
        break;
      case 'east':
        modY = -1;
        break;
      case 'south':
        modX = +1;
        break;
      case 'west':
        modY = +1;
        break;
    }
    if (!forward) {
      modX = -modX;
      modY = -modY;
    }
    return [x + modX, y + modY];
  }

  findSpace(x: number, y: number): Space | undefined {
    const row = this.spaces[y];
    return row ? row[x] : undefined;
  }

  findPlayer(p: Player): [number, number] | undefined {
    for (let y = 0; y < this.spaces.length; y++) {
      for (let x = 0; x < this.spaces[y].length; x++) {
        if (this.spaces[y][x].player === p) {
          return [x, y];
        }
      }
    }
  }

  insertIntoEmptySpace(player: Player): void {
    const emptySpaces = this.emptySpaces();
    const coordinate = this.rng.nextArrayItem(emptySpaces);
    const emptySpace = this.findSpace(...coordinate)!;
    player.direction = this.rng.nextArrayItem([
      'north',
      'east',
      'south',
      'west',
    ]);
    emptySpace.player = player;
  }

  moveIntoNearbyEmptySpace(player: Player): void {
    const emptySpaces = this.emptySpaces(player);
    if (emptySpaces.length === 0) {
      return;
    }
    const coordinate = this.rng.nextArrayItem(emptySpaces);
    const currentArea = this.findPlayer(player)!;
    delete this.findSpace(...currentArea)!.player;
    this.findSpace(...coordinate)!.player = player;
  }
}

/**
 * Represents an active game.
 */
class Session {
  private readonly actions = new Map<Player, Action>();
  private readonly players = new Map<IO.Socket, Player>();
  private readonly rng = new Prando();
  private spaces!: Room;
  private roundsRemaining = 10;

  private get gameInProgress(): boolean {
    return !!this.spaces;
  }

  addPlayerIfNew(socket: IO.Socket, userName: string): Player {
    let player = this.players.get(socket);
    if (!player) {
      player = new Player(userName, socket);
      this.players.set(socket, player);
    }
    if (this.gameInProgress) {
      this.fullSync(player);
    }
    return player;
  }

  private fullSync(player: Player): void {
    player.sendFullSync({
      roundsRemaining: this.roundsRemaining,
      selectedAction: this.gameInProgress
        ? this.actions.get(player)
        : 'doNothing',
    });
  }

  setActionForPlayer(socket: IO.Socket, action: Action): void {
    const player = this.players.get(socket);
    if (!player || this.actions.get(player)) {
      return;
    }
    this.actions.set(player, action);
    this.fullSync(player);
    this.endOfTurnCheck();
  }

  private endOfTurnCheck(): void {
    if (this.actions.size !== this.players.size) {
      return;
    }
    this.performActions();
    this.roundsRemaining--;
    if (this.roundsRemaining === 0) {
      this.players.forEach((p) => p.recordEvents('Game Over'));
    }
    this.clearPlayersState();
  }

  private clearPlayersState(): void {
    this.actions.clear();
    this.players.forEach((p) => this.fullSync(p));
  }

  startGame(): void {
    this.spaces = new Room(3, 3, this.rng);
    this.placeAllPlayers();
    this.players.forEach((p) => this.fullSync(p));
  }

  private placeAllPlayers(): void {
    this.players.forEach((p) => this.spaces.insertIntoEmptySpace(p));
  }

  private performActions(): void {
    this.players.forEach((player) => player.startEvents());
    this.actions.forEach((action, player) => {
      switch (action) {
        case 'doNothing':
          player.recordEvents('Action: Did Nothing');
          break;
        case 'turnLeft':
          player.recordEvents('Action: Turned Left');
          player.turnLeft();
          break;
        case 'turnRight':
          player.recordEvents('Action: Turned Right');
          player.turnRight();
          break;
        case 'moveForward':
          player.recordEvents('Action: Move Forward');
          this.moveForward(player);
          break;
        case 'moveBackward':
          player.recordEvents('Action: Move Backward');
          this.moveBackward(player);
          break;
      }
    });
  }

  private moveForward(player: Player): void {
    const current = this.spaces.findPlayer(player)!;
    const newArea = this.spaces.computeSpace(
      current[0],
      current[1],
      player.direction,
      true,
    );
    console.info(`${player.name} ${current} -> ${newArea}`);
    if (!this.spaces.findSpace(...newArea)) {
      return this.wallCollision(player);
    } else {
      delete this.spaces.findSpace(...current)!.player;
      this.spaces.findSpace(...newArea)!.player = player;
    }
  }

  private moveBackward(player: Player): void {
    const current = this.spaces.findPlayer(player)!;
    const newArea = this.spaces.computeSpace(
      current[0],
      current[1],
      player.direction,
      false,
    );
    console.info(`${player.name} ${current} -> ${newArea}`);
    if (!this.spaces.findSpace(...newArea)) {
      // TODO: Make the injury table more severe for backward moves.
      return this.wallCollision(player);
    } else {
      delete this.spaces.findSpace(...current)!.player;
      this.spaces.findSpace(...newArea)!.player = player;
    }
  }

  private wallCollision(player: Player): void {
    const injury = this.rng.nextArrayItem<Injuries>([
      'nothing',
      'nothing',
      'nothing',
      'disoriented',
      'disoriented',
      'tripped',
    ]);
    player.recordEvents('Collided with a Wall');
    switch (injury) {
      case 'nothing':
        break;
      case 'disoriented':
        if (this.rng.nextBoolean()) {
          player.turnLeft();
        } else {
          player.turnRight();
        }
        player.recordEvents('Disoriented');
        break;
      case 'tripped':
        this.spaces.moveIntoNearbyEmptySpace(player);
        player.recordEvents('Tripped');
        break;
    }
  }
}

// Game instance.
const session = new Session();

// Service instance.
const server = IO(4000).on('connection', (socket) => {
  socket
    .on('JOIN', (userName: string) => {
      console.info(`${userName} (re?)-joined.`);
      session.addPlayerIfNew(socket, userName);
    })
    .on('START', () => {
      console.info('Received START command');
      session.startGame();
    })
    .on('SET_ACTION', (action: Action) => {
      session.setActionForPlayer(socket, action);
    });
});

console.info('Listening on *:4000');

function end(): void {
  console.error('Closing server...');
  server.server.close();
}

process.once('SIGINT', end);
process.once('SIGTERM', end);
