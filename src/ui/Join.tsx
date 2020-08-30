import { Form, Input, Button } from 'antd';
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

export function Join(props: { onJoin?: (name: string) => Promise<void> }) {
  const [form] = Form.useForm();
  const [disableJoin, setDisableJoin] = useState(!props.onJoin);
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
        <Button type="primary" htmlType="submit" disabled={disableJoin}>
          Join
        </Button>
      </Form.Item>
    </Form>
  );
}
