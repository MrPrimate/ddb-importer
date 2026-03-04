import DDBFeatureActivity from "./DDBFeatureActivity";
import DDBItemActivity from "./DDBItemActivity";
import DDBMonsterFeatureActivity from "./DDBMonsterFeatureActivity";
import DDBSpellActivity from "./DDBSpellActivity";
import DDBVehicleActivity from "./DDBVehicleActivity";

export {};

global {
  type IDDBActivityTypes = DDBFeatureActivity
    | DDBItemActivity
    | DDBSpellActivity
    | DDBVehicleActivity
    | DDBMonsterFeatureActivity;
}
