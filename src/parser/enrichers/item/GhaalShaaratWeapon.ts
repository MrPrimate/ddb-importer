import { utils } from "../../../lib/_module";
import MistypedCrossbow from "./MistypedCrossbow";

// Every ghaal'shaarat carries the same Returning Weapon trait: "The weapon has
// the Thrown property with a normal range of 30 feet and a long range of 120
// feet. It returns to your hand immediately after it is used to make a ranged
// attack roll." DDB ships none of the variants with the property. The crossbow
// variants additionally need the retype MistypedCrossbow provides.
export default class GhaalShaaratWeapon extends MistypedCrossbow {

  static THROWN_RANGE = { value: 30, long: 120 };

  override get override(): IDDBOverrideData {
    return {
      func: ({ enricher }) => {
        const document = enricher.data;
        if (document.type !== "weapon") return;
        document.system.properties = utils.addToProperties(document.system.properties, "thr");
        document.system.properties = utils.addToProperties(document.system.properties, "ret");

        // a melee ghaal'shaarat has only its 5ft reach as a range; give it the
        // thrown range, matching how DDB ships a handaxe or a javelin. The
        // ranged variants keep the longer range they already have.
        if ((document.system.type?.value ?? "").endsWith("M")) {
          document.system.range = {
            ...document.system.range,
            value: GhaalShaaratWeapon.THROWN_RANGE.value,
            long: GhaalShaaratWeapon.THROWN_RANGE.long,
            units: "ft",
          };
        }
      },
    };
  }

}
