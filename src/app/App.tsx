import { Layout, message } from 'antd';
import React from 'react';
import genName from '../lib/name';
import io from 'socket.io-client';
import { JoinDialog } from './Join';

export class App extends React.Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      showJoinModal: false,
      userId: genName(),
    };
  }

  componentDidMount() {
    if (!this.state.socket) {
      this.tryConnecting();
    }
  }

  private tryConnecting(): void {
    const key = 'try-connecting';
    message.loading({
      content: 'Connecting to server...',
      duration: 0,
      key,
    });
    const socket = io('ws://:4000');

    socket.on('disconnect', () => {
      message.error('Connection closed... Will try to reconnect');
    });

    socket.on('connect', () => {
      message.success({
        content: 'Connected!',
        key,
      });
      if (this.state.roomId && this.state.userId) {
        this.onJoinSession(this.state.roomId, this.state.userId);
      } else {
        this.setState({ showJoinModal: true });
      }

      socket.once('JOINED_ROOM', () => {
        message.info(
          `Joined room ${this.state.roomId} as ${this.state.userId}`,
        );
      });
    });
    this.setState({ socket });
  }

  private onJoinSession(roomId: string, userId: string): void {
    this.state.socket!.emit('JOIN_ROOM', roomId, userId);
    this.setState({
      roomId,
      userId,
      showJoinModal: false,
    });
  }

  render() {
    return (
      <Layout className="layut">
        <Layout.Header>
          <div className="logo">Dark Room</div>
          <JoinDialog
            initialUserId={this.state.userId}
            handleJoin={this.onJoinSession.bind(this)}
            visible={this.state.showJoinModal}
          ></JoinDialog>
        </Layout.Header>
        <Layout.Content style={{ padding: '20px 50px' }}>
          <div className="site-layout-content"></div>
        </Layout.Content>
      </Layout>
    );
  }
}

export interface AppState {
  socket?: SocketIOClient.Socket;
  showJoinModal: boolean;
  roomId?: string;
  userId: string;
}
