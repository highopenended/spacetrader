export interface Anchor {
  id: string;
  xVw: number; // left position in vw
  bottomVh: number; // bottom position in vh
  label: string;
  // Scrap center in viewport units for connector lines
  cxVw?: number; // center x in vw
  cyVh?: number; // center y in vh (from bottom)
}


