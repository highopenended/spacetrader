import { Anchor } from './types';

type Listener = (anchors: Anchor[]) => void;

let currentAnchors: Anchor[] = [];
const listeners = new Set<Listener>();

export const setAnchors = (anchors: Anchor[]) => {
  currentAnchors = anchors;
  listeners.forEach((l) => l(currentAnchors));
};

export const getAnchors = (): Anchor[] => currentAnchors;

export const clear = () => {
  if (currentAnchors.length === 0) return;
  currentAnchors = [];
  listeners.forEach((l) => l(currentAnchors));
};

export const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener);
  // Emit current immediately
  listener(currentAnchors);
  return () => {
    listeners.delete(listener);
  };
};


