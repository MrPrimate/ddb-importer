/* eslint-disable @typescript-eslint/no-unsafe-function-type */
// Type declarations for third-party module/system globals not covered by foundry-vtt-types.
// Core Foundry globals (game, CONFIG, CONST, Hooks, foundry, canvas, ui, Actor, Item, etc.)
// are provided by @league-of-foundry-developers/foundry-vtt-types via tsconfig.json "types".
//
// This file must be a module (has `export {}`) so that `declare global` properly
// merges into globalThis. Without it, SettingConfig augmentation is invisible to
// other modules and game.settings.get/set only recognizes "core" as a namespace.

import { IDDBIConfig } from "../hooks/ready/registerGameSettings";
import { DDBConfig } from "./ddb-character-source";

export {};

declare global {

  type IndexTypeForMetadata<Type extends CompendiumCollection.DocumentName> = foundry.utils.Collection<
    CompendiumCollection.IndexEntry<Type>
  >;

  declare namespace CompendiumCollection {
    interface ExtendedGetIndexOptions<T extends CompendiumCollection.DocumentName>
      extends GetIndexOptions<T> {
      fields?: string[];
    }
  }

  // ddb-importer module global
  interface Window {
    DDBImporter: {
      lib: Record<string, any>;
      [key: string]: any;
    };
  }
  let DDBImporter: {
    lib: Record<string, any>;
    [key: string]: any;
  };

  // Third-party Foundry module globals
  const MidiQOL: any;
  const DAE: any;
  const Sequencer: any;
  const Sequence: any;
  const chrisPremades: any;
  const AutomatedAnimations: any;
  const AdventureImporter: any;
  const ForgeVTT: any;
  const ForgeAPI: any;

  // Custom skills module
  const dnd5eCustomSkills: any;

  // JSZip library (loaded at runtime, not bundled)
  const JSZip: any;

  interface CONFIG extends CONFIG {
    DDBI: IDDBIConfig;
    // Temp, until we use dnd5e-types
    DND5E: {
      abilities: Record<string, {
        label: string;
      }>;
      abilityActivationTypes: Record<string, string>;
      activityTypes: Record<string, {
        documentClass: Function | Activity
      }>;
      actorSizes: Record<string, {
        label: string;
      }>;
      areaTargetTypes: Record<string, {
        label: string;
        counted: string;
        template: string;
        standard?: boolean;
      }>;
      armorClasses: Record<string, {
        label: string
      }>;
      consumableTypes: Record<string, {
        label: string;
        subtypes?: Record<string, string>;
      }>;
      // This one's added by midi
      customDamageResistanceTypes: Record<string, string>;
      damageTypes: Record<string, {
        label: string;
        icon: string;
        isPhysical?: boolean;
        reference?: string;
        color?: Color;
      }>;
      equipmentTypes: Record<string, string>;
      healingTypes: Record<string, {
        label: string;
        icon: string;
        color?: Color;
      }>;
      itemActionTypes: Record<string, string>;
      skills: Record<string, {
        label: string;
        ability: string;
      }>;
      sourcePacks: {
        BACKGROUNDS: string;
        CLASSES: string;
        ITEMS: string;
        RACES: string;
      };
      spellSchools: Record<string, {
        label: string;
        icon: string;
        fullKey: string;
        reference?: string;
      }>;
      tools: Record<string, {
        ability: string;
        id: string;
      }>;
      toolTypes: Record<string, string>;
      traits: Record<string, {
        labels: {
          title: string;
          localization: string;
          all?: string;
        };
        icon: string;
        actorKeyPath?: string;
        configKey?: string;
        dataType?: number | boolean;
        labelKeyPath?: string;
        subTypes?: {
          keyPath?: string;
          ids?: string[];
        };
        children?: Record<string, string>;
        sortCategories?: boolean;
        expertise?: boolean;
        mastery?: boolean;
      }>
      weaponMasteries: Record<string, { label: string, reference?: string }>;
      weaponTypes: Record<string, string>;
    }
    DDB: DDBConfig;
  }

}
