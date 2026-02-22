// Type declarations for third-party module/system globals not covered by foundry-vtt-types.
// Core Foundry globals (game, CONFIG, CONST, Hooks, foundry, canvas, ui, Actor, Item, etc.)
// are provided by @league-of-foundry-developers/foundry-vtt-types via tsconfig.json "types".

// D&D 5e system global
declare const dnd5e: any;

// ddb-importer module global
interface Window {
  DDBImporter: {
    lib: Record<string, any>;
    [key: string]: any;
  };
}
declare let DDBImporter: {
  lib: Record<string, any>;
  [key: string]: any;
};

// Third-party Foundry module globals
declare const MidiQOL: any;
declare const DAE: any;
declare const Sequencer: any;
declare const Sequence: any;
declare const chrisPremades: any;
declare const AutomatedAnimations: any;
declare const AdventureImporter: any;
declare const ForgeVTT: any;
declare const ForgeAPI: any;

// Custom skills module
declare const dnd5eCustomSkills: any;

// JSZip library (loaded at runtime, not bundled)
declare const JSZip: any;
