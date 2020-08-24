import Emittery from 'emittery';
import { Socket, Server, Namespace } from 'socket.io';

export class Protocol extends Emittery.Typed<{
  connected: Readonly<{ room: Room; user: Player }>;
}> {
  private readonly rooms = new Map<string, Room>();

  constructor(private readonly socket: Server) {
    super();
    socket.on('connect', (client: Socket) => {
      client.on('JOIN_ROOM', (roomId: string, userId: string) => {
        const room = this.createRoom(roomId);
        const user = room.createPlayer(userId, client);
        this.emit('connected', { user, room });
      });
    });
  }

  private createRoom(roomId: string): Room {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = new Room(roomId, this.socket.to(roomId));
      this.rooms.set(roomId, room);
    }
    return room;
  }
}

export class Room {
  private readonly players = new Map<string, Player>();

  constructor(public readonly id: string, private readonly socket: Namespace) {}

  public createPlayer(userId: string, socket: Socket): Player {
    let player = this.players.get(userId);
    if (!player) {
      player = new Player(userId, socket);
      this.players.set(userId, player);
    }
    return player;
  }
}

export class Player {
  constructor(public readonly id: string, private readonly socket: Socket) {}
}
