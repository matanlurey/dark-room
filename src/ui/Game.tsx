import React, { useState } from 'react';
import { Button, Col, Divider, Row, Timeline, Statistic } from 'antd';

export type Action = 'moveForward' | 'moveBackward' | 'turnLeft' | 'turnRight';

export function Game(
  props: {
    onActionSelect?: (action: Action) => Promise<boolean>;
    remainingSeconds?: number;
    roundsRemaining?: number;
    selectedAction?: Action;
    timelineEvents?: string[][];
  } = {},
) {
  const [disableActions, setDisableActions] = useState(!props.onActionSelect);
  const trySelectAction = async (action: Action) => {
    setDisableActions(true);
    setDisableActions(await props.onActionSelect!(action));
  };
  return (
    <>
      <Divider>Status</Divider>
      <Row gutter={[16, 16]}>
        <Col span={12} style={{ display: 'flex' }}>
          <Statistic
            title="Time in Round"
            value={props.remainingSeconds || '?'}
          />
        </Col>
        <Col span={12} style={{ display: 'flex' }}>
          <Statistic
            title="Rounds Remaining"
            value={props.roundsRemaining || '?'}
          />
        </Col>
      </Row>
      <Divider>Actions</Divider>
      <Row gutter={[16, 16]}>
        <Col span={12} style={{ display: 'flex' }}>
          <Button
            disabled={disableActions}
            style={{ flex: 1 }}
            onClick={() => trySelectAction('moveForward')}
            type={
              props.selectedAction === 'moveForward' ? 'primary' : undefined
            }
          >
            Move Forward
          </Button>
        </Col>
        <Col span={12} style={{ display: 'flex' }}>
          <Button
            disabled={disableActions}
            style={{ flex: 1 }}
            onClick={() => trySelectAction('moveBackward')}
            type={
              props.selectedAction === 'moveBackward' ? 'primary' : undefined
            }
          >
            Move Backward
          </Button>
        </Col>
      </Row>
      <br />
      <Row gutter={[16, 16]}>
        <Col span={12} style={{ display: 'flex' }}>
          <Button
            disabled={disableActions}
            style={{ flex: 1 }}
            onClick={() => trySelectAction('turnLeft')}
            type={props.selectedAction === 'turnLeft' ? 'primary' : undefined}
          >
            Turn Left
          </Button>
        </Col>
        <Col span={12} style={{ display: 'flex' }}>
          <Button
            disabled={disableActions}
            style={{ flex: 1 }}
            onClick={() => trySelectAction('turnRight')}
            type={props.selectedAction === 'turnRight' ? 'primary' : undefined}
          >
            Turn Right
          </Button>
        </Col>
      </Row>
      <Divider>Timeline</Divider>
      <Row>
        <Col span={24}>
          <Timeline mode="alternate" pending={true}>
            {(props.timelineEvents || []).map((events, turn) => {
              return (
                <Timeline.Item label={`Turn ${turn}`}>
                  {events.map((e) => (
                    <p>{e}</p>
                  ))}
                </Timeline.Item>
              );
            })}
          </Timeline>
        </Col>
      </Row>
    </>
  );
}
