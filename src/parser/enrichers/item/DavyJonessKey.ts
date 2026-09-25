import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Release the Kraken opens a 15-foot-radius gate for 1 minute, once per dawn, and the ground in
 * it is difficult terrain. The tentacles it brings are creatures the GM runs; their attack, the
 * thrown-creature save and the crushing damage are rolls made by hand, as is the suffocation save
 * a natural 20 forces.
 */
export default class DavyJonessKey extends DDBEnricherData {

  // the parser turns the tentacle's damage into a second weapon attack, rebuilt here as its own
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Release the Kraken", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "action",
            value: null,
            condition: "The ground in the area is difficult terrain",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "circle", size: "15" },
          },
          rangeOverride: { override: true, value: "60", units: "ft" },
          durationOverride: { override: true, value: "1", units: "minute" },
        },
        overrides: {
          addItemConsume: true,
          noeffect: true,
        },
      },
      {
        init: { name: "Tentacle Attack", type: DDBEnricherData.ACTIVITY_TYPES.ATTACK },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: null, condition: "One attack per tentacle when the gate opens, or as an action while a tentacle remains" },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: "30", units: "ft" },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["bludgeoning"] }),
          ],
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          flatAttack: "10",
          data: {
            attack: { ability: "none", type: { value: "melee", classification: "weapon" } },
            damage: { includeBase: false },
          },
        },
      },
      {
        init: { name: "Escape Check", type: DDBEnricherData.ACTIVITY_TYPES.CHECK },
        build: {
          generateTarget: false,
          generateRange: false,
          generateConsumption: false,
          generateCheck: true,
          checkOverride: { ability: "", associated: ["acr", "ath"], dc: { calculation: "", formula: "17" } },
        },
        overrides: { noConsumeTargets: true, noTemplate: true, noeffect: true },
      },
      {
        init: { name: "Crushing Tentacle Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateSave: false,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["bludgeoning"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "Ends its turn Restrained by a tentacle",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
      {
        init: { name: "Thrown Creature Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "17" } },
          activationOverride: {
            type: "special",
            value: null,
            condition: "A tentacle throws its target at this creature: it takes the thrown target's damage and falls Prone",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { damage: { onSave: "none" } },
        },
      },
      {
        init: { name: "Suffocation Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "15" } },
          activationOverride: {
            type: "special",
            value: null,
            condition: "You rolled a 20 on an attack against it; repeated at the end of each of its turns",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { damage: { onSave: "none" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Grappled by a Tentacle",
        activityMatch: "Tentacle Attack",
        statuses: ["Grappled", "Restrained"],
        options: { transfer: false, description: "Large or smaller targets only. Grappled (escape DC 17) and Restrained until the grapple ends." },
      },
      {
        name: "Suffocating",
        activityMatch: "Suffocation Save",
        options: { transfer: false, description: "Suffocating and unable to speak. Repeat the save at the end of each turn; it also ends at 0 Hit Points." },
      },
    ];
  }

}
