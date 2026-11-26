import { EraMeta } from '../types/era';

export const ERAS: EraMeta[] = [
  {
    id: 'mechanical',
    code: '01',
    year: '1842',
    shortTitle: 'MECHANICAL',
    fullTitle: 'Mechanical Adding Engine',
    machineRef: 'Difference & Step-Drum Class',
    powerRitual: 'No power button — your own arm is the clock.',
    story:
      'Before electricity, computing was literal physical labor. You set input levers by hand and turned a brass crank until heavy iron gears rolled over each ten.',
    specs: {
      clock: '~2 Hz (Hand)',
      power: '0 W (Human)',
      switches: 'Brass Gears',
      taskTime: '4.5 sec',
    },
  },
  {
    id: 'relay',
    code: '02',
    year: '1941',
    shortTitle: 'RELAY',
    fullTitle: 'Electromechanical Relay',
    machineRef: 'Zuse Z3 / Harvard Mark I Class',
    powerRitual: 'Throw the knife switch, feed a punch card, hear the room clatter.',
    story:
      'Electricity replaced muscle, yet every 0 and 1 still required a physical metal armature snapping shut. A single moth wedged in a contact could break the math.',
    specs: {
      clock: '~5 Hz',
      power: '4,000 W',
      switches: '2,600 Relays',
      taskTime: '1.6 sec',
    },
  },
  {
    id: 'vacuum',
    code: '03',
    year: '1945',
    shortTitle: 'VACUUM TUBE',
    fullTitle: 'Thermionic Vacuum Array',
    machineRef: 'ENIAC Class',
    powerRitual: 'Warm the glass filaments first — cold tubes shatter under high voltage.',
    story:
      'No moving parts at last. Engineers waited for thousands of tungsten heaters to glow orange while pulling enough power to dim city streetlights, praying no tube popped mid-run.',
    specs: {
      clock: '100 kHz',
      power: '150 kW',
      switches: '17,468 Tubes',
      taskTime: '0.0002 sec',
    },
  },
  {
    id: 'transistor',
    code: '04',
    year: '1958',
    shortTitle: 'TRANSISTOR',
    fullTitle: 'Discrete Solid-State Logic',
    machineRef: 'TX-0 / Early Mainframe Rack',
    powerRitual: 'Flip one chrome toggle: instant boot, dead silent.',
    story:
      'No waiting for filaments to heat, no clacking coils, no blown glass. Solid silicon shrank a room-sized furnace into a quiet metal cabinet.',
    specs: {
      clock: '1 MHz',
      power: '350 W',
      switches: '3K Discrete',
      taskTime: '0.00001 sec',
    },
  },
  {
    id: 'micro8',
    code: '05',
    year: '1981',
    shortTitle: '8-BIT PC',
    fullTitle: 'Microprocessor & CRT',
    machineRef: 'Personal Silicon Desktop',
    powerRitual: 'Snap the red rocker switch — hear the POST beep, watch the CRT bloom.',
    story:
      'An entire processor fit onto one thumbnail of silicon. Computers left server halls and landed on desks with glowing green phosphor and a blinking cursor.',
    specs: {
      clock: '1–4 MHz',
      power: '45 W',
      switches: '29K On-Die',
      taskTime: '2 µs',
    },
  },
  {
    id: 'modern',
    code: '06',
    year: '2026',
    shortTitle: 'MODERN',
    fullTitle: 'Multicore & Parallel GPU',
    machineRef: 'Nanometer Silicon Array',
    powerRitual: 'Tap once: billions of switches wake up before your finger lifts.',
    story:
      'Once shrinking atoms hit thermal limits, computing split into massive parallel grids. One fast CPU core solves sequentially; hundreds of GPU cores light up together.',
    specs: {
      clock: '5.4 GHz',
      power: '250 W',
      switches: '80B+ Gates',
      taskTime: '0.000000001 s',
    },
  },
];
