export {};

global {
  interface IDDBImporterDebugLogEntry {
    level: string;
    message: string;
    payload?: any[];
  }
  interface IDDBImporterDebugConfig {
    record: boolean;
    log: IDDBImporterDebugLogEntry[];
    download: () => void;
  }

  interface IIconMapEntry {
    type: string;
    folder: string | null;
    _id: string;
    uuid: string;
    name: string;
    img: string;
    prototypeToken?: {
      texture: {
        src: string;
        scaleY: number;
        scaleX: number;
      };
    };
  }
}
