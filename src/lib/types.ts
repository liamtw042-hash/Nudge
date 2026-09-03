export type GlazeKey = 'clay' | 'ochre' | 'moss' | 'plum' | 'slate';

export type Step = {
  id: string;
  name: string;
  /** Planned length of the step in seconds. */
  seconds: number;
};

export type Routine = {
  id: string;
  name: string;
  color: GlazeKey;
  steps: Step[];
};

/** What happened to one step during a run. Only 'done' is ever shown back. */
export type StepOutcome = 'done' | 'skipped';
