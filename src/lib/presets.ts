import { newId } from './id';
import type { Routine, Step } from './types';

function steps(list: [string, number][]): Step[] {
  return list.map(([name, seconds]) => ({ id: newId(), name, seconds }));
}

/**
 * The four starters. Real micro-steps, small enough that starting one is
 * not a decision. Written to be read aloud: short, plain, a full stop.
 */
export function makePresets(): Routine[] {
  return [
    {
      id: newId(),
      name: 'Morning',
      color: 'clay',
      steps: steps([
        ['Sit up. Feet on the floor.', 30],
        ['Water. A whole glass.', 60],
        ['Bathroom.', 120],
        ['Face. Cold water.', 60],
        ['Teeth.', 120],
        ['Meds, if you take them.', 30],
        ["Clothes. Whatever's nearest.", 180],
        ['Something to eat. Anything.', 300],
        ['Bag, keys, phone. By the door.', 60],
      ]),
    },
    {
      id: newId(),
      name: 'Evening',
      color: 'plum',
      steps: steps([
        ['Phone on charge. Across the room.', 60],
        ["Tomorrow's clothes. Lay them out.", 120],
        ['Dishes into the sink. Just the sink.', 120],
        ['Bag packed for tomorrow.', 120],
        ['Meds, if you take them.', 30],
        ['Teeth.', 120],
        ['Face.', 60],
        ['Water by the bed.', 60],
        ['Lights low.', 30],
      ]),
    },
    {
      id: newId(),
      name: 'Getting Out the Door',
      color: 'moss',
      steps: steps([
        ['Keys. In your hand.', 30],
        ['Phone. Wallet.', 30],
        ["Bag. Check it's all in.", 60],
        ['Shoes on.', 60],
        ['Jacket. Look outside first.', 30],
        ['Stove off. Windows shut.', 30],
        ['Door. Go.', 15],
      ]),
    },
    {
      id: newId(),
      name: 'Starting Work',
      color: 'ochre',
      steps: steps([
        ['Water on the desk.', 60],
        ['Clear the surface. Just the surface.', 120],
        ['Phone face down. Other room if you can.', 30],
        ['Open the one file.', 60],
        ['Write the first line. Any line.', 120],
        ['Ten minutes. Just ten.', 600],
      ]),
    },
  ];
}
