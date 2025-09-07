/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class FingerGuns extends DDBEnricherData {

  static RANGE_DATA = [
    { level: 1, range: 60, rangeLong: 240, min: null, max: 4 },
    { level: 5, range: 90, rangeLong: 360, min: 5, max: 10 },
    { level: 11, range: 120, rangeLong: 480, min: 11, max: 16 },
    { level: 17, range: 150, rangeLong: 600, min: 17, max: null },
  ];


  getRange() {
    const level = this.ddbParser?.rawCharacter?.flags?.ddbimporter?.dndbeyond?.totalLevels ?? 1;
    const rangeData = FingerGuns.RANGE_DATA.find((r) => level >= r.level && level <= (r.max ?? 20)) || FingerGuns.RANGE_DATA[0];
    return {
      value: rangeData.range,
      long: rangeData.rangeLong,
      units: "ft",
      override: true,
      special: `The long range is ${rangeData.rangeLong} ft`,
    };
  }

  get activity() {
    return {
      name: "Attack",
      noeffect: true,
      targetType: "creature",
      overrideTarget: true,
      targetCount: "1",
      activationOverride: true,
      activationType: "action",
      data: {
        sort: 2,
        duration: {
          override: true,
          value: null,
          units: "inst",
        },
        attack: {
          type: {
            value: "ranged",
          },
        },
        range: this.getRange(),
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Cast",
          type: "utility",
        },
        build: {
          generateTarget: true,
        },
        overrides: {
          targetSelf: true,
          overrideTarget: true,
          rangeSelf: true,
          overrideRange: true,
          data: {
            sort: "1",
          },
          noeffect: true,
        },
      },
      {
        constructor: {
          name: "Cast (Enchantment)",
          type: "enchant",
        },
        build: {
          generateRange: true,
          generateActivation: true,
          generateEnchantment: true,
        },
        overrides: {
          targetSelf: true,
          overrideTarget: true,
          rangeSelf: true,
          overrideRange: true,
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: false,
              categories: ['simpleM', 'natural'],
            },
            sort: 3,
          },
        },
      },
    ];
  }

  get effects() {
    return FingerGuns.RANGE_DATA.map((data) => {
      const changes = [
        DDBEnricherData.ChangeHelper.overrideChange(`Finger Guns`, 20, "name"),
        DDBEnricherData.ChangeHelper.overrideChange("['mgc']", 20, "system.properties"),
        DDBEnricherData.ChangeHelper.overrideChange(`${data.number ?? 2}`, 20, "system.damage.base.number"),
        DDBEnricherData.ChangeHelper.overrideChange(`${data.denomination ?? 6}`, 50, "system.damage.base.denomination"),
        DDBEnricherData.ChangeHelper.overrideChange("force", 50, "system.damage.base.types"),
        DDBEnricherData.ChangeHelper.overrideChange("0", 50, "system.damage.base.custom.enabled"),
        DDBEnricherData.ChangeHelper.overrideChange("none", 50, "activities[attack].attack.ability"),
        DDBEnricherData.ChangeHelper.overrideChange(`${data.range}`, 50, "system.range.value"),
        DDBEnricherData.ChangeHelper.overrideChange(`${data.rangeLong}`, 50, "system.range.long"),
        DDBEnricherData.ChangeHelper.overrideChange("slow", 50, "system.mastery"),
        DDBEnricherData.ChangeHelper.overrideChange("simpleR", 50, "system.type.value"),
        DDBEnricherData.ChangeHelper.overrideChange(`max(@abilities.str.dex, @attributes.spell.mod)`, 50, "activities[attack].attack.bonus"),
        DDBEnricherData.ChangeHelper.overrideChange("", 50, "system.damage.base.bonus"),
        DDBEnricherData.ChangeHelper.overrideChange(this.data.system.description.value, 20, "system.description.value"),
        DDBEnricherData.ChangeHelper.overrideChange("1", 20, "system.proficient"),
        DDBEnricherData.ChangeHelper.overrideChange("icons/weapons/guns/gun-pistol-flintlock-white.webp", 20, "img"),
      ];
      return {
        name: `${this.name} (${data.level} Level)`,
        type: "enchant",
        changes,
        data: {
          "flags.ddbimporter.effectIdLevel": {
            min: data.min,
            max: data.max,
          },
        },
      };
    });
  }

  get override() {
    const range = this.getRange();
    return {
      data: {
        system: {
          range: range,
        },
      },
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbFormOfTheBeast">
<p><strong>Implementation Details</strong></p>
<p>You can use the attack on the spell, or cast this as an enchantment and apply it to your unarmed attack.</p>
</section>`,
    };
  }

}
