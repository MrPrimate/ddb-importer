import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneWard extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Create Ward",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      activationType: "special",
      activationCondition: "When you cast an Abjuration spell with a spell slot",
      addItemConsume: true,
      addActivityConsume: true,
      itemConsumeValue: "-(@classes.wizard.levels + @abilities.int.mod)",
      rangeSelf: true,
      data: {
        img: "systems/dnd5e/icons/svg/activity/save.svg",
        uses: {
          override: true,
          spent: null,
          max: "1",
          recovery: [{ period: "lr", type: "recoverAll" }],
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    const additional = [
      {
        init: {
          name: "Damage Ward",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          img: "systems/dnd5e/icons/svg/activity/damage.svg",
        },
        overrides: {
          activationType: "special",
          addItemConsume: true,
          addScalingMode: "amount",
          rangeSelf: true,
          addConsumptionScalingMax: "(2 * @classes.wizard.levels) + @abilities.int.mod",
        },
      },
      {
        init: {
          name: "Restore Ward After Casting Spell",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          img: "systems/dnd5e/icons/svg/activity/heal.svg",
        },
        overrides: {
          addItemConsume: true,
          addScalingMode: "amount",
          activationType: "special",
          addConsumptionScalingMax: "9",
          activationCondition: "When you cast an Abjuration spell with a spell slot",
          rangeSelf: true,
          itemConsumeValue: "-(@scaling * 2)",
        },
      },
    ] as IDDBAdditionalActivity[];
    if (!this.is2014) {
      additional.push({
        init: {
          name: "Expend Spell Slot for Ward",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          img: "systems/dnd5e/icons/svg/activity/heal.svg",
        },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: "-(@scaling * 2)",
          addScalingMode: "amount",
          addConsumptionScalingMax: "9",
          rangeSelf: true,
          activationType: "bonus",
          additionalConsumptionTargets: [
            {
              type: "spellSlots",
              value: "1",
              target: "1",
              scaling: {
                mode: "level",
                formula: "",
              },
            },
          ],
        },
      });
    }
    return additional;
  }

  get override(): IDDBOverrideData {
    const descriptionSuffix = `
<section class="secret ddbSecret" id="secret-ddbArcaneWard">
<p><strong>Implementation Details</strong></p>
<p>There is a built in automation for absorbing damage and adding to the ward when spells are cast. To disable this see the DDB Importer documentation.</p>
<br>
<p>Uses on this item represent the HP of the Ward.</p>
<p>The <strong>Create Ward</strong> activity tracks ward creation.</p>
<p>The <strong>Damage Ward</strong> activity will reduce the Ward by the damage. <i>This is automated.</i></p>
<p>The <strong>Restore Ward After Casting Spell</strong> activity can be used after you use an Abjuration spell. Use the scaling to match the spell level. <i>This is automated.</i></p>
<p>The <strong>Expend Spell Slot for Ward</strong> activity will spend a spell slot to top up ward.</p>
</section>`;

    const spentName = this.is2014
      ? "Arcane Ward - Hit Points"
      : "Arcane Ward: Hit Points";
    const spent = this._getSpentValue("class", spentName);

    return {
      descriptionSuffix,
      retainResourceConsumption: true,
      uses: {
        spent,
        max: "(2 * @classes.wizard.levels) + @abilities.int.mod",
        recovery: [{ period: "lr", type: "loseAll", formula: undefined }],
      },
    };
  }
}
