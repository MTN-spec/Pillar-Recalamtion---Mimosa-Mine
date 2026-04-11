export interface Pillar {
  pillar_id: string;
  ucs?: number;
  confine?: number;
  rock_str?: number;
  depth?: number;
  Layer?: string;
  safety_score?: number;
  status?: string;
  sequence?: number;
}

export type AppTab = 'map' | 'planner' | 'database' | 'analytics';
