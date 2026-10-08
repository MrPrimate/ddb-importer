import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Shifting is a self enchantment: using "Shift" picks a shifter type, and that type's enchantment
 * is the shift itself. It lasts 1 minute and carries the type's rider activities and its
 * "Shifted" transfer effect, so everything ends together when the enchantment expires or the
 * activity is used again to end it early.
 */
export default class Shifting extends DDBEnricherData {

  static SHIFTER_TYPES = ["Beasthide", "Longtooth", "Swiftstride", "Wildhunt"];

  /**
   * The types this character can shift into: the chosen option (2024) or subrace (2014) when it
   * names one, otherwise all of them (muncher, or an unrecognised choice). Every type built here
   * must get its enchantment too, as an unclaimed "Shifted" transfer effect would apply passively.
   */
  get shifterTypes(): string[] {
    const chosen = this.ddbParser._chosen && this.ddbParser._chosen.length > 0
      ? this.ddbParser._chosen[0].label
      : this.ddbParser.ddbCharacter?._ddbRace.fullName ?? "";
    const match = Shifting.SHIFTER_TYPES.find((type) => chosen?.includes(type));
    return match ? [match] : Shifting.SHIFTER_TYPES;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Shift",
      targetType: "self",
      rangeSelf: true,
      activationType: "bonus",
      // DDB's 2024 Shift action carries no limited use, so nothing else links the item uses
      addItemConsume: true,
      id: utils.namedIDStub("shifterChoice", { prefix: "shift", postfix: "core" }),
      data: {
        enchant: {
          self: true,
        },
        duration: { value: "1", units: "minute" },
      },
    };
  }

  get shiftActivities(): IDDBAdditionalActivity[] {
    const results: IDDBAdditionalActivity[] = [];
    for (const shifterType of this.shifterTypes) {
      results.push({
        init: {
          name: `Shift ${shifterType}`,
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          // was generateHeal, which nothing reads
          generateHealing: true,
          generateConsumption: false,
          generateTarget: true,
        },
        overrides: {
          id: utils.namedIDStub(shifterType, { prefix: "shift", postfix: "ac" }),
          targetType: "self",
          activationType: "special",
          activationCondition: "When you shift",
          data: {
            healing: DDBEnricherData.basicDamagePart({
              customFormula: this.ddbParser.ddbCharacter?._ddbRace.isLegacy
                ? "max(1, @abilities.con.mod) + @detail.level"
                : shifterType === "Beasthide"
                  ? "(2 * @prof) + 1d6"
                  : "2 * @prof",
              types: ["temphp"],
            }),
          },
        },
      });
    }
    return results;
  }

  get additionalActivitiesLongtooth(): IDDBAdditionalActivity[] {
    if (!this.shifterTypes.includes("Longtooth")) return [];
    return [
      {
        init: {
          name: "Longtooth Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: true,
          attackOverride: {
            ability: "str",
            type: {
              value: "melee",
              classification: "weapon",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              type: "piercing",
            }),
          ],
          activationOverride: {
            type: "bonus",
            value: 1,
          },
        },
        overrides: {
          id: "ddblongtoothatta",
        },
      },
    ];
  }

  get additionalActivitiesSwiftstride(): IDDBAdditionalActivity[] {
    // DDB only ships the reaction when Swiftstride is the chosen shifter type
    if (!this.shifterTypes.includes("Swiftstride")) return [];
    if (!this.hasAction({ name: "Swiftstride", type: "race" })) return [];
    return [
      {
        action: {
          name: "Swiftstride",
          type: "race",
          rename: ["Swiftstride Move Reaction"],
        },
        overrides: {
          id: "ddbswiftstridemo",
          noeffect: true,
        },
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const results = [
      ...this.shiftActivities,
      ...this.additionalActivitiesLongtooth,
      ...this.additionalActivitiesSwiftstride,
    ];

    results.push();

    return results;
  }

  get enchantEffects(): IDDBEffectHint[] {
    const results: IDDBEffectHint[] = [];

    for (const shifterType of this.shifterTypes) {
      const activityRiders = [utils.namedIDStub(shifterType, { prefix: "shift", postfix: "ac" })];
      const effect: IDDBEffectHint = {
        name: `Type: ${shifterType}`,
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`End Shift (${shifterType})`, 20, "activities[enchant].name"),
          DDBEnricherData.ChangeHelper.overrideChange("spec", 1, "activities[enchant].activation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("End", 1, "activities[enchant].activation.condition"),
          DDBEnricherData.ChangeHelper.overrideChange("[]", 1, "activities[enchant].consumption.targets"),
        ],
        activityMatch: "Shift",
        options: {
          durationSeconds: 60,
        },
        data: {
          _id: utils.namedIDStub(shifterType, { prefix: "choice", postfix: "ef" }),
          flags: {
            ddbimporter: {
              activityRiders,
              effectRiders: [utils.namedIDStub(shifterType, { postfix: "ef" })],
            },
          },
        },
      };
      if (shifterType === "Longtooth") {
        activityRiders.push("ddblongtoothatta");
      } else if (shifterType === "Swiftstride") {
        activityRiders.push("ddbswiftstridemo");
      }
      results.push(effect);
    }
    return results;
  }

  override get effects(): IDDBEffectHint[] {
    const results = [
      ...this.enchantEffects,
    ];

    for (const shifterType of this.shifterTypes) {
      const changes = [];
      if (shifterType === "Beasthide") {
        changes.push(
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.attributes.ac.bonus"),
        );
      } else if (shifterType === "Swiftstride") {
        changes.push(
          DDBEnricherData.ChangeHelper.unsignedAddChange("10", 20, "system.attributes.movement.speeds.walk"),
        );
      } else if (shifterType === "Wildhunt") {
        changes.push(
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("wis"),
        );
      }
      results.push(
        {
          name: `Shifted: ${shifterType}`,
          options: {
            durationSeconds: 60,
            transfer: true,
          },
          activityMatch: `Shift ${shifterType}`,
          changes,
          data: {
            _id: utils.namedIDStub(shifterType, { postfix: "ef" }),
            flags: {
              dae: {
                selfTarget: true,
                selfTargetAlways: true,
              },
            },
          },
        },
      );
    }
    return results;
  }

  override get override(): IDDBOverrideData {
    const uses = this.ddbParser.ddbCharacter?._ddbRace.isLegacy
      ? {}
      : this._getUsesWithSpent({
        type: "race",
        name: "Shift",
        max: "@prof",
        period: "lr",
      });

    return {
      uses,
      data: {
        "name": "Shifting",
      },
    };
  }

}
