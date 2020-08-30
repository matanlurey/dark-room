import React from 'react';
import { Button, Col, Divider, Row, Timeline, Statistic, Empty } from 'antd';
import { Action } from '../../shared/state';

export function Game(
  props: {
    isStanding?: boolean;
    onActionSelect?: (action: Action) => Promise<boolean>;
    remainingSeconds?: number;
    roundsRemaining?: number;
    selectedAction?: Action;
    timelineEvents?: string[][];
  } = {},
) {
  function actionsDisabled(): boolean {
    return (
      !props.onActionSelect ||
      !!props.selectedAction ||
      props.roundsRemaining === 0
    );
  }
  const trySelectAction = async (action: Action) => {
    props.onActionSelect!(action);
  };
  return (
    <>
      <Divider>Status</Divider>
      <Row gutter={[16, 16]}>
        <Col span={12} style={{ display: 'flex' }}>
          <Statistic
            title="Time in Round"
            value={props.remainingSeconds || 'Untimed (∞)'}
          />
        </Col>
        <Col span={12} style={{ display: 'flex' }}>
          <Statistic
            title="Rounds Remaining"
            value={
              props.roundsRemaining === undefined ? '?' : props.roundsRemaining
            }
          />
        </Col>
      </Row>
      <Divider>Actions</Divider>
      <Row gutter={[16, 16]}>
        <Col span={12} style={{ display: 'flex' }}>
          <Button
            disabled={actionsDisabled()}
            style={{ flex: 1 }}
            onClick={() => trySelectAction('moveForward')}
            type={props.selectedAction === 'moveForward' ? 'dashed' : undefined}
          >
            Move Forward
          </Button>
        </Col>
        <Col span={12} style={{ display: 'flex' }}>
          <Button
            disabled={actionsDisabled()}
            style={{ flex: 1 }}
            onClick={() => trySelectAction('moveBackward')}
            type={
              props.selectedAction === 'moveBackward' ? 'dashed' : undefined
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
            disabled={actionsDisabled()}
            style={{ flex: 1 }}
            onClick={() => trySelectAction('turnLeft')}
            type={props.selectedAction === 'turnLeft' ? 'dashed' : undefined}
          >
            Turn Left
          </Button>
        </Col>
        <Col span={12} style={{ display: 'flex' }}>
          <Button
            disabled={actionsDisabled()}
            style={{ flex: 1 }}
            onClick={() => trySelectAction('turnRight')}
            type={props.selectedAction === 'turnRight' ? 'dashed' : undefined}
          >
            Turn Right
          </Button>
        </Col>
      </Row>
      <br />
      <Row gutter={[16, 16]}>
        <Col span={12} style={{ display: 'flex' }}>
          <Button
            disabled={actionsDisabled()}
            style={{ flex: 1 }}
            onClick={() => trySelectAction('reachForward')}
            type={
              props.selectedAction === 'reachForward' ? 'dashed' : undefined
            }
          >
            Reach Forward/Use Item
          </Button>
        </Col>
        <Col span={12} style={{ display: 'flex' }}>
          <Button
            disabled={actionsDisabled()}
            style={{ flex: 1 }}
            onClick={() =>
              trySelectAction(
                props.isStanding === false ? 'standUp' : 'crouchDown',
              )
            }
            type={
              props.selectedAction === 'standUp' ||
              props.selectedAction === 'crouchDown'
                ? 'dashed'
                : undefined
            }
          >
            {props.isStanding === false ? 'Stand Up' : 'Crouch Down'}
          </Button>
        </Col>
      </Row>
      <Divider>Timeline</Divider>
      <Row>
        <Col span={24}>
          {(() => {
            if (!props.timelineEvents || props.timelineEvents.length === 0) {
              return <Empty description={<>No events yet!</>} />;
            } else {
              return (
                <Timeline mode="left" pending={true} reverse={true}>
                  {props.timelineEvents.map((events, turn) => {
                    return (
                      <Timeline.Item label={`Turn ${turn + 1}`} key={turn}>
                        {events.map((e, i) => (
                          <p key={i}>{e}</p>
                        ))}
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              );
            }
          })()}
        </Col>
      </Row>
    </>
  );
}
