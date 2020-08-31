import { Action, Item } from '../shared/state';
import IO from 'socket.io';
import Prando from 'prando';

type Direction = 'north' | 'east' | 'south' | 'west';
type Injuries = 'nothing' | 'disoriented' | 'tripped';

/**
 * Represents a player in the game.
 */
class Player {
  private readonly events: string[][] = [];

  readonly items: Item[] = [];
  isStanding = true;
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
    this.socket.emit('SYNC', {
      ...args,
      timelineEvents: this.events,
      isStanding: this.isStanding,
    });
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
  readonly items: Item[] = [];
  player?: Player;
}

/**
 * Represents room data.
 */
class Room {
  private readonly spaces: Space[][];
  private door!: [number, number];

  constructor(width: number, height: number, private readonly rng: Prando) {
    const spaces = (this.spaces = new Array(height));
    for (let i = 0; i < spaces.length; i++) {
      spaces[i] = Array.from(Array(width), (_) => new Space());
    }
  }

  isDoor(x: number, y: number): boolean {
    return this.door[0] === x && this.door[1] === y;
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

  initializeElements(): void {
    this.insertDoor();
    this.insertKey();
  }

  private insertKey(): void {
    const coordinate = this.rng.nextArrayItem(this.emptySpaces())!;
    const emptySpace = this.findSpace(...coordinate);
    emptySpace!.items.push('key');
    console.info('Inserted the key in', coordinate);
  }

  private insertDoor(): void {
    const size = this.spaces.length - 1;
    let coordinate = this.rng.nextArrayItem(
      this.emptySpaces().filter((p) => {
        if (p[0] === 0) {
          return p[1] !== 0;
        } else if (p[1] === 0) {
          return p[0] !== 0;
        } else if (p[0] === size) {
          return p[1] !== size;
        } else if (p[1] === size) {
          return p[0] !== size;
        } else {
          return false;
        }
      }),
    );
    if (coordinate[0] === 0) {
      coordinate[0] = -1;
    }
    if (coordinate[1] === 0) {
      coordinate[1] = -1;
    }
    if (coordinate[0] === size) {
      coordinate[0] = size + 1;
    }
    if (coordinate[1] === size) {
      coordinate[1] = size + 1;
    }
    this.door = coordinate;
    console.info('Inserted the door in', coordinate);
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
  private roundsRemaining = 8;
  private doorUnlocked = false;

  private get gameInProgress(): boolean {
    return !!this.spaces;
  }

  bootPlayers(): void {
    this.players.forEach((p) => p.socket.emit('BOOT'));
  }

  addPlayerIfNew(socket: IO.Socket, userName: string): Player {
    let player = this.players.get(socket);
    if (!player) {
      player = new Player(userName, socket);
      this.players.set(socket, player);
    }
    if (this.gameInProgress) {
      this.fullSync(player);
    } else {
      this.roundsRemaining += 2;
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
    } else {
      this.players.forEach((p) => this.checkSurroundings(p));
    }
    if (this.doorUnlocked) {
      this.players.forEach((p) =>
        p.recordEvents('Door was unlocked. You win!'),
      );
      this.roundsRemaining = 0;
    }
    this.clearPlayersState();
  }

  private clearPlayersState(): void {
    this.actions.clear();
    this.players.forEach((p) => this.fullSync(p));
  }

  startGame(): void {
    let w = 3;
    let h = 3;
    w += this.players.size - 1;
    h += this.players.size - 1;
    this.spaces = new Room(w, h, this.rng);
    this.placeAllPlayers();
    this.spaces.initializeElements();
    this.players.forEach((p) => {
      p.startEvents('You awake in a Dark Room');
      this.checkSurroundings(p);
      this.fullSync(p);
    });
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
          this.movePlayer(player, true);
          break;
        case 'moveBackward':
          player.recordEvents('Action: Move Backward');
          this.movePlayer(player, false);
          break;
      }
    });
  }

  private pickUpItems(player: Player): void {
    const current = this.spaces.findSpace(...this.spaces.findPlayer(player)!)!;
    if (current.items.length) {
      player.recordEvents(`Picked Up: ${current.items.join(', ')}`);
      player.items.push(...current.items);
      current.items.length = 0;
    }
  }

  private movePlayer(player: Player, forwards: boolean): void {
    const current = this.spaces.findPlayer(player)!;
    const newArea = this.spaces.computeSpace(
      current[0],
      current[1],
      player.direction,
      forwards,
    );
    console.info(`${player.name} ${current} -> ${newArea}`);
    const newSpace = this.spaces.findSpace(...newArea);
    if (!newSpace) {
      this.doCollision(player, 'Wall');
    } else if (newSpace.player) {
      this.doCollision(player, 'Player');
      this.doCollision(newSpace.player, 'Player', false);
    } else {
      delete this.spaces.findSpace(...current)!.player;
      this.spaces.findSpace(...newArea)!.player = player;
    }
  }

  private checkSurroundings(player: Player): void {
    const current = this.spaces.findPlayer(player)!;
    const cForwards = this.spaces.computeSpace(
      current[0],
      current[1],
      player.direction,
      true,
    );
    player.turnLeft();
    const cToLeft = this.spaces.computeSpace(
      current[0],
      current[1],
      player.direction,
      true,
    );
    player.turnLeft();
    player.turnLeft();
    const cToRight = this.spaces.computeSpace(
      current[0],
      current[1],
      player.direction,
      true,
    );
    player.turnLeft();
    const forwards = this.spaces.findSpace(...cForwards);
    const toLeft = this.spaces.findSpace(...cToLeft);
    const toRight = this.spaces.findSpace(...cToRight);
    let recordedEvent = false;
    function recordEvent(event: string): void {
      recordedEvent = true;
      player.recordEvents(event);
    }
    if (forwards) {
      if (forwards.player) {
        player.recordEvents('You feel a player in front of you');
      }
    } else if (this.spaces.isDoor(...cForwards)) {
      recordEvent('You feel a door in front of you');
      if (player.items.indexOf('key') !== -1) {
        recordEvent('You open the door');
        this.doorUnlocked = true;
      }
    } else {
      recordEvent('You feel a wall in front of you');
    }
    if (toLeft) {
      if (toLeft.player) {
        player.recordEvents('You feel a player to the left of you');
      }
    } else if (this.spaces.isDoor(...cToLeft)) {
      recordEvent('You feel a door to the left of you');
    } else {
      recordEvent('You feel a wall to the left of you');
    }
    if (toRight) {
      if (toRight.player) {
        player.recordEvents('You feel a player to the right of you');
      }
    } else if (this.spaces.isDoor(...cToRight)) {
      recordEvent('You feel a door to the right of you');
    } else {
      recordEvent('You feel a wall to the right of you');
    }
    if (!recordedEvent) {
      recordEvent("You don't detect anything around you");
    }
    this.pickUpItems(player);
  }

  private doCollision(player: Player, name: string, initiated = true): void {
    const injury = this.rng.nextArrayItem<Injuries>([
      'nothing',
      'nothing',
      'nothing',
      'disoriented',
      'disoriented',
      'tripped',
    ]);
    if (initiated) {
      player.recordEvents(`Collided with a ${name}`);
    } else {
      player.recordEvents(`${name} Collided with You`);
    }
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
let session = new Session();

// Service instance.
const server = IO(4000).on('connection', (socket) => {
  socket
    .on('JOIN', (userName: string) => {
      console.info(`${userName} (re?)-joined.`);
      session.addPlayerIfNew(socket, userName);
    })
    .on('RESTART', () => {
      session.bootPlayers();
      session = new Session();
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
