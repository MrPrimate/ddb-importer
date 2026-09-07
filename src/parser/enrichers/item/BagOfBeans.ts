import DDBEnricherData from "../data/DDBEnricherData";

export default class BagOfBeans extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  /** 2014 beans explode into fire, the 2024 reprint into force. */
  get explosionDamageType(): string {
    return this.is2014 ? "fire" : "force";
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Dump Beans",
      activationType: "special",
      activationCondition: "Object interaction",
      rangeSelf: true,
      addItemConsume: true,
      itemConsumeValue: 1,
      addScalingMode: "amount",
      addConsumptionScalingMax: "@item.uses.value",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 5, denomination: 4, type: this.explosionDamageType }),
      ],
      data: {
        damage: {
          onSave: "half",
        },
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            type: "sphere",
            size: "10",
            units: "ft",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Count Beans",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          generateDamage: false,
          activationOverride: {
            // the SRD leaves this blank; "none" is our nearest legal value and reads the same
            type: "none",
            value: null,
            condition: "Upon discovering the bag",
          },
        },
        overrides: {
          noTemplate: true,
          targetType: "object",
          data: {
            description: {
              chatFlavor: "3d4 dry beans found in bag.",
            },
            // a negative consumption ADDS uses, so rolling this sets the bag's bean count
            consumption: {
              targets: [
                { type: "itemUses", value: "-3d4", target: "", scaling: {} },
                { type: "activityUses", value: "1", scaling: {} },
              ],
            },
            uses: {
              spent: 0,
              max: "1",
              recovery: [],
            },
            target: {
              affects: {
                count: "1",
                type: "object",
                special: "Held Bag of Beans",
              },
            },
          },
        },
      },
      {
        init: {
          name: "Plant Bean",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          generateDamage: false,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Object interaction",
          },
        },
        overrides: {
          noTemplate: true,
          targetType: "space",
          data: {
            description: {
              chatFlavor: "The bean produces an effect 1 minute later; roll on the Bag of Beans table.",
            },
            consumption: {
              targets: [
                { type: "itemUses", value: "1", target: "" },
              ],
            },
            target: {
              affects: {
                count: "1",
                type: "space",
                special: "Dirt or sand",
              },
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      retainUseSpent: true,
      // the bag holds 3d4 beans, so 12 is the most it can be found with; Count Beans
      // spends the difference down to the number actually rolled
      uses: {
        spent: 0,
        max: "12",
        recovery: [],
      } as I5eSystemLimitedUses,
    };
  }

}
