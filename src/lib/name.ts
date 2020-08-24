import Prando from 'prando';

const animals = [
  'aardvark',
  'anteater',
  'antelope',
  'bat',
  'bear',
  'cat',
  'chicken',
  'dog',
  'duck',
  'elephant',
  'frog',
  'shark',
  'tortoise',
  'wolf',
  'zebra',
];

const adjectives = [
  'able',
  'adorable',
  'admired',
  'afraid',
  'alarming',
  'amused',
  'blaring',
  'blushing',
  'bouncy',
  'brave',
  'competent',
  'cool',
  'corny',
  'dull',
  'eager',
  'easy',
  'flawed',
  'formal',
  'hastey',
  'hollow',
  'honored',
];

export default function (seed?: number | string): string {
  const rng = new Prando(seed);
  return `${rng.nextArrayItem(adjectives)}-${rng.nextArrayItem(
    animals,
  )}-${rng.nextInt(100, 999)}`;
}
