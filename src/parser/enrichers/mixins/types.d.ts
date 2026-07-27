import type DDBMonsterFeature from "../../monster/features/DDBMonsterFeature";
// import type DDBBasicActivity from "../../activities/DDBBasicActivity";
// import type DDBFeatureMixin from "../../features/DDBFeatureMixin";
import type DDBAction from "../../features/DDBAction";
import type DDBAttackAction from "../../features/DDBAttackAction";
import type DDBChoiceFeature from "../../features/DDBChoiceFeature";
import type DDBFeature from "../../features/DDBFeature";
import type DDBItem from "../../item/DDBItem";
import type DDBSpell from "../../spells/DDBSpell";
import type DDBComponentFeature from "../../vehicle/DDBComponentFeature";
import type DDBCharacter from "../../DDBCharacter";
import type DDBMonster from "../../DDBMonster";
import type DDBCompanionFactory from "../../companions/DDBCompanionFactory";

export {};

global {

  interface ICustomFunctionOptions {
    name?: string | null;
    activity?: IDDBActivityData | null;
  }

  interface IAdditionalActivityOutline {
    type: string;
    name: string;
    options: IDDBActivityBuild;
  }

  // species info nested into extraFlags by CharacterFeatureFactory racial trait parsing
  interface IDDBSpeciesFlagInfo {
    fullRaceName?: string;
    baseName?: string;
    baseRaceName?: string;
    groupName?: string;
    isLineage?: boolean;
  }

  type TDDBParsers = (DDBAction
    | DDBAttackAction
    | DDBChoiceFeature
    | DDBFeature
    | DDBItem
    | DDBMonsterFeature
    | DDBComponentFeature
    | DDBSpell)
    // fields that only exist on some of the parsers above (mostly the
    // DDBFeatureMixin family) but are read generically by enrichers
    & {
      klass?: string;
      subKlass?: string;
      subClass?: string;
      // string via flags.ddbimporter.species; object when CharacterFeatureFactory passes race details
      species?: string | IDDBSpeciesFlagInfo | null;
      isMuncher?: boolean;
      ddbCharacter?: DDBCharacter | null;
      _chosen?: { label: string; [key: string]: any }[];
      ddbFeature?: any;
      extraFlags?: IItemFlagConfig;
      _parent?: IDDBClassFeature | IDDBRacialTrait;
      _class?: IDDBClass;
      ddbCompanionFactory?: DDBCompanionFactory;
      // DDBMonsterFeature fields read by monster enrichers
      // loose: DDBItem and DDBMonsterFeature carry different actionData shapes
      actionData?: any;
      html?: string;
      isMartialArtist?: (klass?: IDDBClass) => boolean;
      _generateAutoEffects?: (options: { html: string; addToMonster?: boolean }) => any;
      strippedHtml?: string;
      ddbMonster?: DDBMonster | null;
      // DDBSpell fields read by spell enrichers
      lookupName?: string;
      cantripBoost?: boolean;
      itemCompendium?: CompendiumCollection.Any;
    };

  type TActivityGenerator = new (...args: any[]) => TDDBActivityTypes;

  // result buckets from DDBEnricherFactoryMixin.getFeatureActionsName
  interface IDDBFeatureActionMatches {
    all: IDDBAction[];
    name: IDDBAction[];
    id: IDDBAction[];
    options: IDDBAction[];
    choices: IDDBAction[];
  }
}
