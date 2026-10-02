import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Battlechef's Splendid Saucepan: functions as a +1 Mace (stubbed as the SRD mace so dnd5e applies
 * the bonus), with an extra 1d4 Thunder against targets in metal armor or made of metal or stone,
 * and +1 AC while worn as a helmet.
 */
export default class BattlechefsSplendidSaucepan extends DDBEnricherData {

  override get documentStub(): IDDBDocumentStub {
    return {
      documentType: "weapon",
      parsingType: "weapon",
      replaceDefaultActivity: false,
      systemType: {
        value: "simpleM",
        baseItem: "mace",
      },
      copySRD: {
        name: "Mace",
        type: "weapon",
        uuid: "Compendium.dnd5e.items.Item.Ajyq6nGwF7FtLhDQ",
      },
    };
  }

  override get stopDefaultActivity(): boolean {
    return true;
  }

  // DDB's restricted damage modifiers ("when used as a Mace", the metal-target thunder) would add
  // Restricted Attack copies of the mace attack; the thunder is its own damage activity below
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Extra Thunder Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "When you hit a target wearing metal armor or made of metal or stone",
          },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["thunder"] })],
          targetOverride: {
            affects: { count: "1", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Worn as a Helmet",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.attributes.ac.bonus"),
        ],
        options: {
          transfer: true,
          disabled: true,
          durationSeconds: null,
          expiry: null,
          description: "+1 Armor Class while you wear the saucepan as a helmet (not with Heavy armor). Enable this effect while it is worn.",
        },
      },
    ];
  }

}
