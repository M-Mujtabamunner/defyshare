import { useCallback, useEffect, useState } from 'react';

// One identity per browser profile: localStorage is shared by every tab, so all
// tabs on a computer appear as the same member.
const ID_KEY = 'defyshare:device-id';
const NAME_KEY = 'defyshare:device-name';
const CUSTOM_KEY = 'defyshare:device-name-custom';
const CHANGE_EVENT = 'defyshare:device-name';

export const MAX_NAME_LENGTH = 24;

export const DEVICE_NAMES = [
  'Thunder Blast', 'Rainbow Unicorn', 'Cosmic Panda', 'Turbo Falcon', 'Velvet Comet', 'Neon Tiger', 'Silver Fox',
  'Golden Phoenix', 'Crystal Dragon', 'Electric Eel', 'Midnight Owl', 'Solar Flare', 'Lunar Wolf', 'Frosty Penguin',
  'Blazing Comet', 'Mystic Koala', 'Rapid Cheetah', 'Jolly Narwhal', 'Atomic Otter', 'Pixel Parrot', 'Stormy Shark',
  'Sunny Dolphin', 'Shadow Lynx', 'Bouncy Kangaroo', 'Galaxy Gecko', 'Mighty Moose', 'Sparkle Pony', 'Rocket Raccoon',
  'Ninja Hedgehog', 'Crimson Hawk', 'Ocean Breeze', 'Polar Bear', 'Lucky Clover', 'Happy Hippo', 'Brave Lion',
  'Quantum Quokka', 'Fuzzy Llama', 'Swift Swallow', 'Royal Peacock', 'Dizzy Dodo', 'Copper Coyote', 'Jade Jaguar',
  'Ruby Robin', 'Amber Antelope', 'Cobalt Crane', 'Emerald Eagle', 'Indigo Ibis', 'Maple Moose', 'Coral Crab',
  'Starlight Stag', 'Velvet Viper', 'Whispering Willow', 'Zesty Zebra', 'Cheery Chipmunk', 'Plasma Puma',
  'Hyper Hummingbird', 'Turbo Tortoise', 'Comet Cat', 'Nova Newt', 'Orbit Orca', 'Meteor Mongoose', 'Aurora Alpaca',
  'Blizzard Bison', 'Cyclone Cougar', 'Dynamo Duck', 'Echo Elephant', 'Flash Flamingo', 'Glacier Goat', 'Harbor Heron',
  'Iron Iguana', 'Jet Jackal', 'Kinetic Kiwi', 'Laser Lemur', 'Magma Manta', 'Nimbus Nightingale', 'Onyx Ocelot',
  'Prism Pelican', 'Quasar Quail', 'Radiant Reindeer', 'Sapphire Seal', 'Tidal Toucan', 'Ultra Urchin', 'Vortex Vulture',
  'Wild Walrus', 'Zen Zebu', 'Bubble Bunny', 'Cocoa Cub', 'Daisy Deer', 'Ember Ermine', 'Fable Ferret', 'Gizmo Gorilla',
  'Honey Hamster', 'Icy Impala', 'Jumbo Jellyfish', 'Karma Koi', 'Lava Lobster', 'Mango Macaw', 'Nacho Nautilus',
  'Oasis Okapi', 'Pepper Puffin', 'Rumble Rhino', 'Salsa Salamander', 'Tango Tapir', 'Waffle Wombat', 'Yeti Yak',
  'Zigzag Zorilla', 'Breezy Beetle', 'Cloudy Camel', 'Dusky Dingo', 'Fiery Fox', 'Groovy Gazelle', 'Hazy Hornet',
  'Jazzy Jay', 'Lofty Lark', 'Misty Marten', 'Noble Nightjar', 'Peppy Platypus', 'Rusty Reef', 'Snowy Sparrow',
  'Thunder Toad', 'Velvet Vole', 'Witty Wren', 'Zippy Zander', 'Crystal Crow', 'Stellar Starfish', 'Sonic Sloth',
  'Nebula Narwhal', 'Twilight Tiger', 'Frost Falcon', 'Spark Squirrel', 'Glow Worm', 'Rainbow Raven', 'Cosmic Cobra',
];

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* storage blocked: identity lasts for this tab only */
  }
};

const randomName = (exclude: Set<string> = new Set()) => {
  const free = DEVICE_NAMES.filter((n) => !exclude.has(n.toLowerCase()));
  const pool = free.length > 0 ? free : DEVICE_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
};

let memoryId: string | null = null;

export const getDeviceId = () => {
  let id = read(ID_KEY) ?? memoryId;
  if (!id) {
    id = crypto.randomUUID();
    write(ID_KEY, id);
  }
  memoryId = id;
  return id;
};

const getDeviceName = () => {
  let name = read(NAME_KEY);
  if (!name) {
    name = randomName();
    write(NAME_KEY, name);
  }
  return name;
};

const isCustomName = () => read(CUSTOM_KEY) === '1';

const setStoredName = (name: string, custom: boolean) => {
  write(NAME_KEY, name);
  write(CUSTOM_KEY, custom ? '1' : '0');
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const cleanName = (raw: string) => raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);

/** This device's id and display name, kept in sync across tabs. */
export const useDevice = () => {
  const [id] = useState(getDeviceId);
  const [name, setName] = useState(getDeviceName);

  useEffect(() => {
    const refresh = () => setName(getDeviceName());
    const onStorage = (e: StorageEvent) => e.key === NAME_KEY && refresh();
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  /** Save an edited name; an empty name falls back to a fresh random one. */
  const rename = useCallback((raw: string) => {
    const next = cleanName(raw);
    if (next) setStoredName(next, true);
    else setStoredName(randomName(), false);
  }, []);

  /** If another device already uses our auto-picked name, pick a different one. */
  const avoidNames = useCallback((taken: string[]) => {
    if (isCustomName()) return;
    const current = getDeviceName().toLowerCase();
    const set = new Set(taken.map((n) => n.toLowerCase()));
    if (set.has(current)) setStoredName(randomName(set), false);
  }, []);

  return { id, name, rename, avoidNames };
};

// --- Avatars: initials on a colour derived from the device id ---
const AVATAR_COLORS = ['#F97316', '#0EA5E9', '#8B5CF6', '#10B981', '#EC4899', '#EAB308', '#14B8A6', '#6366F1', '#EF4444', '#84CC16'];

export const avatarColor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';
