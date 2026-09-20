import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Volcanic Fury rolls its save as the ground erupts, once per dawn, and leaves the 20-foot cube
 * as rubble: difficult terrain until someone clears it, so the area it places is permanent. The
 * DC is the one DDB gives.
 */
export default class FuriousFlail extends DDBEnricherData {

  // the parser's own save for this property would sit beside the one built here
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Volcanic Fury", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "26" } },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 12, types: ["bludgeoning"] }),
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 12, types: ["fire"] }),
          ],
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "action",
            value: null,
            condition: "A point within the weapon's reach; each creature in the area other than you. The rubble left behind is difficult terrain",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "cube", size: "20" },
          },
          rangeOverride: { override: true, value: "10", units: "ft" },
          durationOverride: { override: true, units: "perm" },
        },
        overrides: {
          addItemConsume: true,
          noeffect: true,
          data: {
            damage: { onSave: "half" },
          },
        },
      },
    ];
  }

}
