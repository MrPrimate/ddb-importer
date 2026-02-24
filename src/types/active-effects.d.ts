export {}

global {
  export interface IEffectData {
    img: string;
    name: string;
    statuses: string[];
    changes: any[];
    duration: IEffectDuration;
    tint: string;
    transfer: boolean;
    disabled: boolean;
    flags: {
      dae: {
        showIcon: boolean | null;
        transfer: boolean;
        stackable: string;
        // armorEffect?: boolean;
      };
      ddbimporter: {
        disabled: boolean;
      };
      "midi-qol": {
        forceCEOff: boolean;
      };
      core: Record<string, unknown>;
      [key: string]: any;
    };
    description?: string;
    [key: string]: any;
  }

  interface IEffectModules {
    daeInstalled: boolean;
    midiQolInstalled: boolean;
    atlInstalled: boolean;
    [key: string]: any;
  }

  interface IEffectDuration {
    seconds: number | null;
    startTime: number | null;
    rounds: number | null;
    turns: number | null;
    startRound: number | null;
    startTurn: number | null;
  }

  interface IBaseEffectOptions {
    transfer?: boolean;
    disabled?: boolean;
    description?: string | null;
    durationSeconds?: number | null;
    durationRounds?: number | null;
    durationTurns?: number | null;
    showIcon?: boolean | null;
  }

  interface IStatusConditionEffectOptions {
    text?: string | null;
    status?: any;
    nameHint?: string | null;
    flags?: any;
  }

  interface IStatusEffectOptions {
    ddbDefinition?: any;
    foundryItem?: any;
    labelOverride?: string;
  }

  interface ISimpleConditionOptions {
    disabled?: boolean;
    transfer?: boolean;
  }

}
