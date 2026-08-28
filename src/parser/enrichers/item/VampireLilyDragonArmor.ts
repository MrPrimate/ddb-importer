import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The nine "<Armor> of the Vampire Lily Dragon" variants share one description:
 * a +1 AC bonus (which DDB carries as a granted modifier) plus a retaliation
 * save against anyone who grapples the wearer or hits them in melee. DDB parses
 * the retaliation as an unnamed, inactive save whose ability list picked up the
 * DC from the text.
 */
export default class VampireLilyDragonArmor extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Poison Spines",
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature grapples you, or hits you with a melee attack while within 5 feet of you",
      data: {
        range: {
          override: true,
          value: "5",
          units: "ft",
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: "",
            formula: "15",
          },
        },
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["poison"] }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned (Vampire Lily Spines)",
        activityMatch: "Poison Spines",
        statuses: ["Poisoned"],
        daeSpecialDurations: ["turnEnd"],
        options: {
          description: "Poisoned until the end of its next turn.",
        },
      },
    ];
  }

}
