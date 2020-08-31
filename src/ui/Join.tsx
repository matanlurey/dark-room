import { Form, Input, Button, Row, Col } from 'antd';
import React, { useState } from 'react';
import Prando from 'prando';

function randomName(): string {
  const rng = new Prando();
  const animals = [
    'anteater',
    'cat',
    'fish',
    'gorilla',
    'mule',
    'skunk',
    'zebra',
  ];
  const adjectives = [
    'adventurous',
    'corny',
    'fast',
    'giddy',
    'malicious',
    'sly',
    'zealous',
  ];
  return `${rng.nextArrayItem(adjectives)}-${rng.nextArrayItem(
    animals,
  )}-${rng.nextInt(100, 999)}`;
}

export function Join(props: {
  onJoin?: (name: string) => Promise<void>;
  onStart?: () => Promise<void>;
}) {
  const [form] = Form.useForm();
  const [disableJoin, setDisableJoin] = useState(!props.onJoin);
  const [disableStart, setDisableStart] = useState(!props.onStart);
  const onJoinPressed = async (name: string) => {
    setDisableJoin(true);
    await props.onJoin!(name);
    setDisableJoin(false);
  };
  return (
    <Form
      form={form}
      initialValues={{ name: randomName() }}
      requiredMark={false}
      onFinish={(values) => onJoinPressed(values.name)}
    >
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input minLength={3} maxLength={20} />
      </Form.Item>
      <Form.Item>
        <Row gutter={16}>
          <Col style={{ minWidth: 100 }}>
            <Button type="primary" htmlType="submit" disabled={disableJoin}>
              {disableJoin ? 'Joined' : 'Join'}
            </Button>
          </Col>
          <Col style={{ minWidth: 100 }}>
            <Button
              type="primary"
              disabled={!disableJoin || disableStart}
              onClick={() => {
                setDisableStart(true);
                props.onStart!();
              }}
            >
              {disableStart ? 'Starting' : 'Start'}
            </Button>
          </Col>
        </Row>
      </Form.Item>
    </Form>
  );
}
