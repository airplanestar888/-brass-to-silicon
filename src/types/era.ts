export type EraId =
  | 'mechanical'
  | 'relay'
  | 'vacuum'
  | 'transistor'
  | 'micro8'
  | 'modern';

export interface EraMeta {
  id: EraId;
  code: string;
  year: string;
  shortTitle: string;
  fullTitle: string;
  machineRef: string;
  powerRitual: string;
  story: string;
  specs: {
    clock: string;
    power: string;
    switches: string;
    taskTime: string;
  };
}
