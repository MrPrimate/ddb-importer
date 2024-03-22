import logger from "../../logger.js";
import SETTINGS from "../../settings.js";
import DDBCharacter from "../DDBCharacter.js";
import DDBCompanionFactory from "./DDBCompanionFactory.js";

DDBCharacter.prototype.addCompanionsToDocuments = async function() {
  for (const factory of this.companionFactories) {
    // eslint-disable-next-line no-await-in-loop
    const worldActors = await factory.getExistingWorldCompanions({ limitToFactory: true });
    const profiles = worldActors
      .map((actor) => {
        return {
          _id: foundry.utils.randomID(),
          name: actor.name,
          uuid: `Actor.${actor.id}`,
          count: null,
        };
      });
    if (factory.originDocument) {
      logger.debug("Companion Data Load", {
        originDocument: factory.originDocument,
        profiles,
        worldActors,
        factory,
        summons: factory.summons,
      });
      foundry.utils.setProperty(factory.originDocument, "system.summons", foundry.utils.deepClone(factory.summons));
      foundry.utils.setProperty(factory.originDocument, "system.summons.profiles", profiles);
      foundry.utils.setProperty(factory.originDocument, "system.actionType", "summ");
    }
  }
};

DDBCharacter.prototype.getClassFeature = function(name) {
  const klass = this.source.ddb.character.classes
    .find((k) => k.classFeatures.some((f) => f.definition.name == name));
  return klass?.classFeatures?.find((f) => f.definition.name == name);
};

DDBCharacter.prototype._findDDBSpell = function(name) {
  const spells = [];
  this.source.ddb.character.classSpells.forEach((playerClass) => {
    spells.push(...playerClass.spells);
  });

  const klassSpell = spells.find((s) => s.definition?.name === name);
  if (klassSpell) return klassSpell;

  // Parse any spells granted by class features, such as Barbarian Totem
  const extraKlass = this.source.ddb.character.spells.class.find((s) => s.definition?.name === name);
  if (extraKlass) return extraKlass;

  // Race spells are handled slightly differently
  const race = this.source.ddb.character.spells.race.find((s) => s.definition?.name === name);
  if (race) return race;

  // feat spells are handled slightly differently
  const feat = this.source.ddb.character.spells.feat.find((s) => s.definition?.name === name);
  if (feat) return feat;

  // background spells are handled slightly differently
  if (!this.source.ddbdb.character.spells.background) this.source.ddb.character.spells.background = [];
  const background = this.source.ddb.character.spells.background.find((s) => s.definition?.name === name);
  if (background) return background;

  return undefined;
};

DDBCharacter.prototype._parseCompanion = async function(html, type, originDocument) {
  const ddbCompanionFactory = new DDBCompanionFactory(this, html, { type, originDocument });
  await ddbCompanionFactory.parse();
  this.companionFactories.push(ddbCompanionFactory);
};

DDBCharacter.prototype._importCompanions = async function() {
  for (const factory of this.companionFactories) {
    // eslint-disable-next-line no-await-in-loop
    await factory.updateOrCreateCompanions();
  }
};

DDBCharacter.prototype._getCompanionSpell = async function(name) {
  const spell = this.data.spells.find((s) => s.name === name || s.flags.ddbimporter?.originalName === name);
  if (!spell) return;
  const ddbSpell = this._findDDBSpell(spell.flags.ddbimporter?.originalName ?? spell.name);
  if (!ddbSpell) return;
  await this._parseCompanion(ddbSpell.definition.description, "spell", spell);
};

DDBCharacter.prototype._getCompanionFeature = async function(featureName) {
  const feature = this.data.features.concat(this.data.actions).find((s) =>
    s.name === featureName || s.flags.ddbimporter?.originalName === featureName
  );
  if (!feature) return;
  const ddbFeature = this.getClassFeature(featureName);
  if (!ddbFeature) return;
  await this._parseCompanion(ddbFeature.definition.description, "feature", feature);
};

DDBCharacter.prototype._getCompanionOption = async function(parentFeature, childName) {
  const feature = this.data.features.concat(this.data.actions).find((s) =>
    s.name === parentFeature
    || s.flags.ddbimporter?.originalName === parentFeature
    || s.name === `${parentFeature}: ${childName}`
    || s.flags.ddbimporter?.originalName === `${parentFeature}: ${childName}`
  );
  if (!feature) return;
  const ddbOption = this.source.ddb.character.options.class.find((o) => o.definition.name == childName);
  if (!ddbOption) return;
  await this._parseCompanion(ddbOption.definition.description, "feature", feature);
};

DDBCharacter.prototype.generateCompanions = async function() {
  for (const name of SETTINGS.COMPANIONS.COMPANION_FEATURES) {
    // eslint-disable-next-line no-await-in-loop
    await this._getCompanionFeature(name);
  }
  for (const name of SETTINGS.COMPANIONS.COMPANION_SPELLS) {
    // eslint-disable-next-line no-await-in-loop
    await this._getCompanionSpell(name);
  }
  for (const [parentFeature, childNames] of Object.entries(SETTINGS.COMPANIONS.COMPANION_OPTIONS)) {
    for (const name of childNames) {
      // eslint-disable-next-line no-await-in-loop
      await this._getCompanionOption(parentFeature, name);
    }
  }

  await this._importCompanions();

  this.companions = this.companionFactories.map((factory) => factory.companions);

  logger.debug("parsed companions", {
    factories: this.companionFactories,
    parsed: this.companions,
  });

  await this.addCompanionsToDocuments();
  // different types of companion
  // ranger beast companions, classic and new
  // ranger drake warden
  // ranger other?
  // artificer steel defender
  // artificer homunculus
  // new summon spells
  // classic summons (not handled here)
  // druid circle of fire companion

};

