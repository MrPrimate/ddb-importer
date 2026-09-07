import type DDBBackgroundEnricher from "./DDBBackgroundEnricher";
import type DDBClassFeatureEnricher from "./DDBClassFeatureEnricher";
import type DDBFeatEnricher from "./DDBFeatEnricher";
import type DDBGenericEnricher from "./DDBGenericEnricher";
import type DDBItemEnricher from "./DDBItemEnricher";
import type DDBMonsterFeatureEnricher from "./DDBMonsterFeatureEnricher";
import type DDBSpeciesTraitEnricher from "./DDBSpeciesTraitEnricher";
import type DDBSpellEnricher from "./DDBSpellEnricher";

export {};

global {

  type TDDBEnricher = DDBGenericEnricher
    | DDBBackgroundEnricher
    | DDBClassFeatureEnricher
    | DDBMonsterFeatureEnricher
    | DDBFeatEnricher
    | DDBItemEnricher
    | DDBSpeciesTraitEnricher
    | DDBSpellEnricher;
}
