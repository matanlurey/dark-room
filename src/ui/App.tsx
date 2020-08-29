import { Layout, Row } from 'antd';
import React from 'react';
import { hot } from 'react-hot-loader';
import { Join } from './Join';
import { Game } from './Game';

function renderContent(gameState: 'disconnected' | 'connected' | 'in-game') {
  switch (gameState) {
    case 'disconnected':
      return 'Connecting...';
    case 'connected':
      return <Join />;
    case 'in-game':
      return <Game />;
  }
}

/**
 * Root application component.
 */
function App() {
  const gameState = 'in-game';
  return (
    <Layout className="layout">
      {/* TODO: Add git version #. */}
      <Layout.Header>Dark Room</Layout.Header>
      <Layout.Content style={{ padding: '20px 50px' }}>
        <div className="site-layout-content">
          <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
            {renderContent(gameState)}
          </Row>
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
