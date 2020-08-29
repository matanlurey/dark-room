import { Form, Input, Button } from 'antd';
import React from 'react';
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

export function Join() {
  const [form] = Form.useForm();
  return (
    <Form
      form={form}
      initialValues={{ name: randomName() }}
      requiredMark={false}
      onFinish={(values) => {
        console.log(values);
      }}
    >
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input minLength={3} maxLength={20} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Join
        </Button>
      </Form.Item>
    </Form>
  );
}
