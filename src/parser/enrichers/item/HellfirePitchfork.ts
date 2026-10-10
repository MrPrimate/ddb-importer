import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Hellfire Pitchfork: a heavy +1 trident with an extra 1d8 radiant on a hit (DDB's modifier, on
 * the attack). Its weight cuts the trident's throwing range to 15/45. A bonus action and the
 * command word recall it to your hand from within 60 feet; recalled straight after a ranged attack
 * roll it erupts in a pillar of flame, and any creature in its space makes a DC 16 Dexterity save
 * or takes 1d8 fire. DDB carries that fire as a restricted modifier, which the parser builds as an
 * action save; it is the Pillar of Flame activity instead.
 */
export default class HellfirePitchfork extends WeaponProperties {

  static RECALL = "Recall Pitchfork";

  static PILLAR = "Pillar of Flame";

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(HellfirePitchfork.RECALL, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "bonus",
        condition: "Speak the command word while the trident is within 60 feet of you; it reappears in one of your open hands",
        selfTarget: true,
        noeffect: true,
      }),
      itemProperty(HellfirePitchfork.PILLAR, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "16" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["fire"] })],
        condition: "When you recall the trident immediately after making a ranged attack roll with it: creatures in its space",
        template: { type: "cube", size: "5" },
        range: { value: "45", units: "ft" },
        noeffect: true,
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      func: ({ enricher }) => {
        const document = enricher.data;
        if (document.type !== "weapon") return;
        document.system.range = { ...document.system.range, value: 15, long: 45, units: "ft" };
      },
    };
  }

}
