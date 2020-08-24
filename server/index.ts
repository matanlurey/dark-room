import express from 'express';
import http from 'http';
import io from 'socket.io';

class Session {
  private server?: http.Server;
  private socket?: io.Server;

  constructor(private readonly port: number) {}

  listen(): void {
    if (this.server) {
      throw new Error(`Already listening on port ${this.port}`);
    }
    const app = express();
    this.server = http.createServer(app);
    this.socket = io(this.server);
    this.server.listen(this.port);

    this.socket.on('connect', (client) => {
      console.log('Incoming Connection!');
      client.on('JOIN_ROOM', (roomId: string, userId: string) => {
        console.log(`${userId} joined room ${roomId}`);
        client.join(roomId);
        client.emit('JOINED_ROOM');
      });
    });

    console.log(`Listening on *:${this.port}`);
  }

  close(): void {
    this.socket?.close();
    this.server?.close();
    this.socket = this.server = undefined;
  }
}

new Session(4000).listen();
