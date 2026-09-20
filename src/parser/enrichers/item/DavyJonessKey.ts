import DDBEnricherData from "../data/DDBEnricherData";
import { escapeCheck, regionPlacer, regionTrigger } from "../data/RegionBuilders";

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
      regionPlacer("Release the Kraken", {
        template: { type: "circle", size: "15" },
        range: "60",
        duration: { value: "1", units: "minute" },
        consume: true,
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
        ],
      }),
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
      escapeCheck("17"),
      regionTrigger("Crushing Tentacle Damage", {
        condition: "Ends its turn Restrained by a tentacle",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["bludgeoning"] }),
        ],
      }),
      regionTrigger("Thrown Creature Save", {
        condition: "A tentacle throws its target at this creature: it takes the thrown target's damage and falls Prone",
        save: { ability: ["dex"], dc: "17" },
      }),
      regionTrigger("Suffocation Save", {
        condition: "You rolled a 20 on an attack against it; repeated at the end of each of its turns",
        save: { ability: ["con"], dc: "15" },
      }),
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
