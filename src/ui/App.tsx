import { Layout } from 'antd';
import React, { useState } from 'react';
import { hot } from 'react-hot-loader';
import { Join } from './Join';
import { Game } from './Game';
import IO from 'socket.io-client';
import { GameState } from '../../shared/state';

type ConnectionState = 'disconnected' | 'connected' | 'in-game';

/**
 * Root application component.
 */
function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    'disconnected',
  );
  const [userName, setUserName] = useState<string | undefined>();
  const [gameState, setGameState] = useState<GameState>();
  const [gameSocket] = useState<SocketIOClient.Socket>(() => {
    const socket = IO(`ws://${window.location.hostname}:4000`);
    socket
      .on('connect', () =>
        setConnectionState(userName ? 'in-game' : 'connected'),
      )
      .on('FULL_SYNC', (state: GameState) => {
        console.log('FULL_SYNC', state);
        setGameState(state);
        setUserName(userName);
        setConnectionState('in-game');
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
              switch (connectionState) {
                case 'disconnected':
                  return 'Connecting...';
                case 'connected':
                  return (
                    <Join
                      onJoin={(userName) => {
                        gameSocket.emit('JOIN', userName);
                        // TODO: Resolve the promise on join error/rejection.
                        return new Promise(() => {});
                      }}
                      onStart={() => {
                        gameSocket.emit('START');
                        // TODO: Resolve the promise on join error/rejection.
                        return new Promise(() => {});
                      }}
                    />
                  );
                case 'in-game':
                  return (
                    <Game
                      isStanding={gameState?.isStanding}
                      onActionSelect={(action) => {
                        gameSocket.emit('SET_ACTION', action);
                        return Promise.resolve(true);
                      }}
                      roundsRemaining={gameState?.roundsRemaining}
                      selectedAction={gameState?.selectedAction}
                      timelineEvents={gameState?.timelineEvents}
                    />
                  );
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
