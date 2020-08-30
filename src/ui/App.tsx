import { Layout } from 'antd';
import React, { useState } from 'react';
import { hot } from 'react-hot-loader';
import { Join } from './Join';
import { Game } from './Game';
import IO from 'socket.io-client';

type GameState = 'disconnected' | 'connected' | 'in-game';

/**
 * Root application component.
 */
function App() {
  const [gameState, setGameState] = useState<GameState>('disconnected');
  const [userName, setUserName] = useState<string | undefined>();
  const [gameSocket] = useState<SocketIOClient.Socket>(() => {
    const socket = IO('ws://localhost:4000');
    socket
      .on('connect', () => setGameState(userName ? 'in-game' : 'connected'))
      .on('JOINED', (userName: string) => {
        setUserName(userName);
        setGameState('in-game');
      });
    return socket;
  });
  return (
    <Layout className="layout">
      {/* TODO: Add git version #. */}
      <Layout.Header>Dark Room</Layout.Header>
      <Layout.Content>
        <div className="site-layout-content">
          <div style={{ margin: '20px 50px' }}>
            {(() => {
              switch (gameState) {
                case 'disconnected':
                  return 'Connecting...';
                case 'connected':
                  return (
                    <Join
                      onJoin={(userName) => {
                        console.log('JOIN', userName);
                        gameSocket.emit('JOIN', userName);
                        // TODO: Resolve the promise on join error/rejection.
                        return new Promise(() => {});
                      }}
                    />
                  );
                case 'in-game':
                  return <Game />;
              }
            })()}
          </div>
        </div>
      </Layout.Content>
    </Layout>
  );
}

/**
 * Wraps the root component and enables some "stateful" hot-module reloading.
 *
 * @see https://github.com/cdharris/react-app-rewire-hot-loader
 */
export default hot(module)(App);
