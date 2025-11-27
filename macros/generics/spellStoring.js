// console.warn(scope)

const isSimpleDDBMacro = scope && foundry.utils.getProperty(scope, "flags.ddb-importer.ddbMacroFunction");

if (!isSimpleDDBMacro) {
  console.error("Not a DDB Simple Macro call, exiting");
  return;
}

const parentActor = (typeof actor !== 'undefined')
  ? actor
  : undefined;

const caster = (typeof token !== 'undefined')
  ? token
  : undefined;

const sourceItem = (typeof item !== 'undefined')
  ? item
  : undefined;

if (!parentActor || !sourceItem) {
  ui.notifications.error("No parent actor or source item found");
  return;
}

const scopeParameters = JSON.parse(scope.parameters ?? "\{\}");
const flag = scopeParameters.flag ?? "spell-storing-item";
const flagData = foundry.utils.getProperty(parentActor, `flags.world.${flag}`);

console.debug("MACRO CALL", {
  scope,
  isSimpleDDBMacro,
  flagData,
  scopeParameters,
  parentActor,
  caster,
  origin,
  sourceItem,
});

if (scopeParameters.action === "store-spell") {
  // let rules = scopeParameters.rules ?? "2024";

  const activities = {};
  for (const [key, value] of Object.entries(sourceItem._source.system.activities)) {
    if (value.type === "cast" || value.type === "enchant") activities[`-=${key}`] = null;
    else activities[key] = value;
  }
  await sourceItem.update({ "system.activities": activities, effects: [] });

  console.warn({
    sourceItem,
    source: sourceItem.toObject(),
  })

  let uuid = await dnd5e.applications.CompendiumBrowser.selectOne({
    filters: {
      locked: {
        additional: {},
        arbitrary: [
          // { k: "system.source.rules", o: "exact", v: rules }
        ],
        documentClass: "Item",
        types: new Set(["spell"])
      },
      initial: {
        additional: {
          spelllist: {
            "class:artificer": 1,
          },
          level: {
            min: 1,
            max: 3,
          }
        },
      },
    },
    selection: { }
  });

  if (!uuid) {
    ui.notifications.warning("No spell selected to store in item, aborting.");
    return;
  }

  const rollData = parentActor.getRollData();


  const castActivityId = await DDBImporter.lib.Enrichers.mixins.DDBBasicActivity.addQuickCastActivity({
    uuid,
    actor: parentActor,
    document: sourceItem,
    spellOverride: {
      uuid,
      properties: ["vocal", "somatic", "material"],
      level: null,
      challenge: {
        attack: rollData.attributes.spell.attack,
        save: rollData.attributes.spell.dc,
        override: true,
      },
      spellbook: true,
    },
    consumptionTargetOverrides:  [
      {
        type: "activityUses",
        target: "",
        value: 1,
        scaling: {
          mode: "",
          formula: "",
        },
      },
    ],
    activityData: {
      uses: {
        max: `2 * ${rollData.abilities.int.mod}`,
        spent: 0,
        recovery: [],
      },
    },
  });

  const enchantId =await DDBImporter.lib.Enrichers.mixins.DDBBasicActivity.addQuickEnchantmentActivity({
    riderActionIds: [castActivityId],
    actor: parentActor,
    document: sourceItem,
    label: "Stored Spell",
    changes: [
      {
        key: "name",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: `{} (Stored Spell)`,
        priority: 20,
      },
    ],
  });

    await parentActor.update({
    [`flags.world.${flag}`]: {
      uuid,
      castActivityId,
      enchantId,
    },
  });

  console.debug("RESULTS", { uuid, castActivityId, sourceItem, parentActor, enchantId });

}


