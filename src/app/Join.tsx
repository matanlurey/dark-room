import { Modal, Form, Input, Button } from 'antd';
import React from 'react';

export default function (props: {
  handleJoin: (room: string, user: string) => void;
  userId: string;
  visible: boolean;
}) {}

interface JoinProps {
  handleJoin: (roomId: string, userId: string) => void;
  initialUserId: string;
  visible: boolean;
}

interface JoinState {
  userId: string;
  roomId: string;
}

export class JoinDialog extends React.Component<JoinProps, JoinState> {
  constructor(props: JoinProps) {
    super(props);
    this.state = {
      userId: props.initialUserId,
      roomId: '',
    };
  }

  render() {
    return (
      <Modal
        closable={false}
        title="Join Game Session"
        visible={this.props.visible}
        footer={[
          <Button
            key="submit"
            disabled={
              this.state.roomId.length < 3 || this.state.roomId.length < 3
            }
            type="primary"
            onClick={() => {
              this.props.handleJoin(this.state.roomId, this.state.userId);
            }}
          >
            Join
          </Button>,
        ]}
      >
        <p>Enter a valid room ID and to pick a user ID</p>
        <Form labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
          <Form.Item label="Room ID">
            <Input
              minLength={3}
              maxLength={12}
              value={this.state.roomId}
              onChange={(v) => {
                this.setState({ roomId: v.target.value });
              }}
            />
          </Form.Item>
          <Form.Item label="User ID">
            <Input
              minLength={3}
              maxLength={20}
              value={this.state.userId}
              onChange={(v) => {
                this.setState({ roomId: v.target.value });
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
