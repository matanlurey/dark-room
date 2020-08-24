import express from 'express';
import http from 'http';
import io from 'socket.io';
import { Protocol } from './lib/protocol';

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

    new Protocol(this.socket).on('connected', (event) => {
      console.log(`${event.user.id} joined ${event.room.id}`);
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
