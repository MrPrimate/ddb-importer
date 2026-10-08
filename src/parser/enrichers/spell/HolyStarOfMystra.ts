import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";
import { endSpellChanges, riders, selfEnchantCast } from "./_SelfEnchantSpell";

/**
 * Cast as a self-enchantment (see _SelfEnchantSpell) with one profile per elemental immunity, so the
 * choice is made in the cast's usage dialog. Each profile carries its immunity and the mote's cover
 * and light as effect riders, and the bolt Attack as an activity rider, so the bolt only appears
 * while the spell lasts (the first bolt, made as part of the cast, is used straight after it).
 */
export default class HolyStarOfMystra extends DDBEnricherData {

  static CAST_ID = "ddbHolyStarMCast";

  static ATTACK_ID = "ddbHolyStarMAtck";

  static MOTE_ID = "ddbHolyStarMMote";

  static ELEMENTS = [
    { type: "Acid", img: "icons/magic/acid/dissolve-bone-white.webp" },
    { type: "Cold", img: "icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp" },
    { type: "Fire", img: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp" },
    { type: "Lightning", img: "icons/magic/lightning/bolt-strike-blue.webp" },
    { type: "Thunder", img: "icons/magic/sonic/explosion-shock-wave-teal.webp" },
  ];

  static immunityId(type: string): string {
    return utils.namedIDStub(type, { prefix: "hsm", postfix: "imm" });
  }

  static profileId(type: string): string {
    return utils.namedIDStub(type, { prefix: "hsm", postfix: "enc" });
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return selfEnchantCast({ name: "Cast Spell", id: HolyStarOfMystra.CAST_ID });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          noSpellslot: true,
          generateRange: true,
          generateConsumption: false,
          noeffect: true,
        },
        overrides: {
          id: HolyStarOfMystra.ATTACK_ID,
          // later bolts are part of the cast spell and spend nothing
          noConsumeTargets: true,
          activationType: "bonus",
          overrideActivation: true,
          targetType: "enemy",
          noeffect: true,
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 4,
                  denomination: 10,
                  bonus: "@mod",
                  types: ["radiant", "force"],
                }),
              ],
            },
            range: {
              override: true,
              units: "ft",
              value: "120",
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    const immunities: IDDBEffectHint[] = HolyStarOfMystra.ELEMENTS.map((element) => ({
      name: `Elemental Immunity: ${element.type}`,
      changes: [
        DDBEnricherData.ChangeHelper.damageImmunityChange(element.type, 1),
      ],
      img: element.img,
      options: {
        transfer: true,
        durationSeconds: 60,
      },
      data: {
        _id: HolyStarOfMystra.immunityId(element.type),
      },
    }));
    const mote: IDDBEffectHint = {
      name: "Mote of Light",
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("5", 20, "token.light.bright"),
        DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "token.light.dim"),
      ],
      statuses: ["coverThreeQuarters"],
      options: {
        transfer: true,
        durationSeconds: 60,
      },
      data: {
        _id: HolyStarOfMystra.MOTE_ID,
      },
    };
    const profiles: IDDBEffectHint[] = HolyStarOfMystra.ELEMENTS.map((element) => ({
      name: `Holy Star of Mystra: ${element.type}`,
      img: element.img,
      type: "enchant",
      activityMatch: "Cast Spell",
      changes: endSpellChanges(HolyStarOfMystra.CAST_ID, "End Holy Star of Mystra"),
      data: {
        _id: HolyStarOfMystra.profileId(element.type),
        flags: {
          ddbimporter: riders({
            activities: [HolyStarOfMystra.ATTACK_ID],
            effects: [HolyStarOfMystra.immunityId(element.type), HolyStarOfMystra.MOTE_ID],
          }),
        },
      },
    }));
    return [...immunities, mote, ...profiles];
  }

}
