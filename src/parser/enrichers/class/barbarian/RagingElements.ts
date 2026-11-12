import DDBEnricherData from "../../data/DDBEnricherData";

type TRagingElement = "Icefury" | "Lava Burst" | "Lightning Bolt";

const ELEMENTS: TRagingElement[] = ["Icefury", "Lava Burst", "Lightning Bolt"];

interface IRagingElementDetail {
  faces: number;
  damageType: string;
  rider: { number: number; denomination: number; type: string; trigger: string };
}

const DETAILS: Record<TRagingElement, IRagingElementDetail> = {
  "Icefury": { faces: 8, damageType: "cold", rider: { number: 1, denomination: 10, type: "fire", trigger: "Fire" } },
  "Lava Burst": { faces: 4, damageType: "fire", rider: { number: 1, denomination: 8, type: "lightning", trigger: "Lightning" } },
  "Lightning Bolt": { faces: 6, damageType: "lightning", rider: { number: 1, denomination: 6, type: "cold", trigger: "Cold" } },
};

/**
 * Raging Elements (Path of the Elements, World of Warcraft; the WoW Shaman's Elemental
 * Specialization). DDB models the options as a choice, and a lone chosen option merges into this
 * document, so the options are built here from the chosen label (all three when nothing is
 * chosen). DDB's actions roll the level 20 dice plus the ability modifier; the text rolls Rage
 * Damage dice with no modifier, at DC 8 + Con mod + PB. Elemental Overload adds its rider for the
 * option when the character has it.
 */
export default class RagingElements extends DDBEnricherData {

  get elements(): TRagingElement[] {
    const names = [
      ...(this.ddbParser._chosen ?? []).map((choice) => choice.label),
      this.data.name,
    ].map((name) => (name ?? "").trim());
    const chosen = ELEMENTS.filter((element) =>
      names.some((name) => name === element || name.endsWith(`: ${element}`)),
    );
    return chosen.length > 0 ? chosen : ELEMENTS;
  }

  get hasOverload(): boolean {
    return this.hasClassFeature({ featureName: "Elemental Overload" });
  }

  rageDice(faces: number): string {
    return `(@scale.${this.classIdentifier("Barbarian")}.rage-damage)d${faces}`;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  #primary(element: TRagingElement): IDDBAdditionalActivity {
    const detail = DETAILS[element];
    const damageParts = [
      DDBEnricherData.basicDamagePart({ customFormula: this.rageDice(detail.faces), types: [detail.damageType] }),
    ];
    const build: IDDBActivityBuild = {
      generateActivation: true,
      generateTarget: true,
      generateRange: true,
      generateDamage: true,
      activationOverride: { type: "bonus", value: 1, condition: "While your Rage is active" },
      targetOverride: { override: true, affects: { count: "1", type: "creature" } },
      rangeOverride: { units: "ft", value: "30" },
      damageParts,
    };
    if (element === "Icefury") {
      return {
        init: { name: element, type: DDBEnricherData.ACTIVITY_TYPES.ATTACK },
        build: {
          ...build,
          generateAttack: true,
          includeBaseDamage: false,
          attackOverride: {
            ability: "con",
            type: { value: "ranged", classification: "spell" },
          },
        },
      };
    }
    return {
      init: { name: element, type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
      build: {
        ...build,
        generateSave: true,
        onSave: "half",
        saveOverride: { ability: ["dex"], dc: { calculation: "con", formula: "" } },
      },
    };
  }

  #rider(element: TRagingElement): IDDBAdditionalActivity {
    const rider = DETAILS[element].rider;
    return {
      init: { name: `${element}: Extra ${rider.trigger} Damage`, type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
      build: {
        generateActivation: true,
        generateDamage: true,
        generateConsumption: false,
        activationOverride: {
          type: "special",
          value: 1,
          condition: `The next time the target takes ${rider.trigger} damage before the end of your next turn`,
        },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: rider.number, denomination: rider.denomination, types: [rider.type] }),
        ],
      },
    };
  }

  #overload(element: TRagingElement): IDDBAdditionalActivity[] {
    if (!this.hasOverload) return [];
    if (element === "Lightning Bolt") {
      return [{
        init: { name: "Elemental Overload: Lightning Leap", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateSave: true,
          generateDamage: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: "After Lightning Bolt, whatever the save" },
          targetOverride: { override: true, affects: { count: "1", type: "creature" } },
          rangeOverride: { units: "ft", value: "30" },
          onSave: "half",
          saveOverride: { ability: ["dex"], dc: { calculation: "con", formula: "" } },
          damageParts: [
            DDBEnricherData.basicDamagePart({ customFormula: this.rageDice(6), types: ["lightning"] }),
          ],
        },
      }];
    }
    const lava = element === "Lava Burst";
    return [{
      init: {
        name: lava ? "Elemental Overload: Burning" : "Elemental Overload: Chill",
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      },
      build: {
        generateActivation: true,
        generateTarget: true,
        generateConsumption: false,
        activationOverride: {
          type: "special",
          value: 1,
          condition: lava ? "After Lava Burst, whatever the save" : "After Icefury, hit or miss",
        },
        targetOverride: lava
          ? {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, type: "radius", size: "10", units: "ft" },
          }
          : { override: true, affects: { count: "1", type: "creature" } },
      },
    }];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.elements.flatMap((element) => [
      this.#primary(element),
      this.#rider(element),
      ...this.#overload(element),
    ]);
  }

  override get effects(): IDDBEffectHint[] {
    const elements = this.elements;
    const effects: IDDBEffectHint[] = [];
    if (!this.hasOverload) return effects;
    if (elements.includes("Icefury")) {
      effects.push({
        name: "Elemental Overload: Chill",
        activityMatch: "Elemental Overload: Chill",
        options: {
          transfer: false,
          expiry: "sourceStart",
          description: "Subtract half the Icefury roll (round down) from the next damage roll you make before the start of the shaman's next turn.",
        },
      });
    }
    if (elements.includes("Lava Burst")) {
      effects.push({
        name: "Burning",
        statuses: ["Burning"],
        activityMatch: "Elemental Overload: Burning",
        options: {
          transfer: false,
          description: "You are &Reference[Burning] and take [[/damage 1d4 fire]] at the start of your turn.",
        },
      });
    }
    return effects;
  }

}
