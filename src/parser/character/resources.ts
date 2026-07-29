import { DICTIONARY } from "../../config/_module";
import { logger, utils } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";

DDBCharacter.prototype.resourceList = function resourceList(this: DDBCharacter): IDDBAction[] {
  if (!this.source) {
    logger.warn("resourceList called before DDB source data was loaded");
    return [];
  }
  const actions = this.source.ddb.character.actions;
  const resources = [actions.race, actions.class, actions.feat]
    .flat()
    .filter((action) =>
      action.limitedUse
        && (action.limitedUse.maxUses || action.limitedUse.statModifierUsesId || action.limitedUse.useProficiencyBonus)
        && !["Hypnotic Gaze"].includes(action.name));

  return resources;
};

DDBCharacter.prototype.getSortedByUsedResourceList = function getSortedByUsedResourceList(this: DDBCharacter): I5ePCResource[] {
  // get all resources
  const allResources = this.resourceList();
  const effectAbilities = this.raw.character.flags?.ddbimporter?.dndbeyond?.effectAbilities;
  const resources: I5ePCResource[] = allResources
    .map((action) => {
      const limitedUse = action.limitedUse;
      if (!limitedUse) {
        // resourceList only returns actions with limitedUse data
        logger.warn(`Resource action ${action.name} is missing limited use data`, { action });
        return { label: action.name, value: 0, max: 0, sr: false, lr: false };
      }
      let maxUses = (limitedUse.maxUses && limitedUse.maxUses !== -1) ? limitedUse.maxUses : 0;

      if (limitedUse.statModifierUsesId) {
        const ability = DICTIONARY.actor.abilities.find(
          (ability) => ability.id === limitedUse.statModifierUsesId,
        )?.value;
        const abilityScore = ability ? effectAbilities?.[ability]?.value : undefined;

        if (abilityScore === undefined) {
          logger.warn(`Unable to determine limited use ability modifier for ${action.name}`, { action });
        } else {
          switch (limitedUse.operator) {
            case 2: {
              maxUses *= utils.calculateModifier(abilityScore);
              break;
            }
            case 1:
            default:
              maxUses += utils.calculateModifier(abilityScore);
          }
        }
      }

      if (limitedUse.useProficiencyBonus) {
        switch (limitedUse.proficiencyBonusOperator) {
          case 2: {
            maxUses *= this.profBonus;
            break;
          }
          case 1:
          default:
            maxUses += this.profBonus;
        }
      }

      return {
        label: action.name,
        value: maxUses - limitedUse.numberUsed,
        max: maxUses,
        sr: limitedUse.resetType === 1,
        lr: limitedUse.resetType === 1 || limitedUse.resetType === 2 || limitedUse.resetType === 3,
      };
    })
    // sort by maxUses, I guess one wants to track the most uses first, because it's used more often
    .sort((a, b) => {
      if (a.max > b.max) return -1;
      if (a.max < b.max) return 1;
      return 0;
    });
  return resources;
};

const sheetResources: string[] = [
  "primary",
  "secondary",
  "tertiary",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
  "eleventh",
  "twelfth",
  "thirteenth",
  "fourteenth",
  "fifteenth",
  "sixteenth",
  "seventeenth",
  "eighteenth",
  "nineteenth",
  "twentieth",
];

DDBCharacter.prototype._generateResources = function _generateResources(this: DDBCharacter, numberOfResources = 3) {
  // get all resources
  const allResources = this.getSortedByUsedResourceList();

  const result: I5ePCResources = {};

  switch (this.resourceChoices.type) {
    case "custom": {
      for (let i = 0; i < sheetResources.length && i < numberOfResources; i++) {
        const key = sheetResources[i] as keyof I5ePCResources;
        const resourceLookupName = this.resourceChoices[key] as string;

        const resource = resourceLookupName && resourceLookupName !== ""
          ? allResources.find((r) => r.label === resourceLookupName)
          : { value: 0, max: 0, sr: false, lr: false, label: "" };
        result[key] = resource || { value: 0, max: 0, sr: false, lr: false, label: "" };
      };
      break;
    }
    case "disable": {
      for (let i = 0; i < sheetResources.length && i < numberOfResources; i++) {
        const key = sheetResources[i] as keyof I5ePCResources;
        result[key] = { value: 0, max: 0, sr: false, lr: false, label: "" };
      };
      break;
    }
    case "remove": {
      for (let i = 0; i < sheetResources.length && i < numberOfResources; i++) {
        const key = sheetResources[i] as keyof I5ePCResources;
        result[key] = { value: 0, max: 0, sr: false, lr: false, label: "" };
      };
      break;
    }
    default: {
      const usedResources = allResources.slice(0, numberOfResources);
      for (let i = 0; i < sheetResources.length && i < numberOfResources; i++) {
        const key = sheetResources[i] as keyof I5ePCResources;
        const resource = usedResources.length > i ? usedResources[i] : { value: 0, max: 0, sr: false, lr: false, label: "" };
        result[key] = resource;
      };
      break;
    }
  }

  this.resources = result;
  const ddbImporterFlags = this.raw.character.flags?.ddbimporter;
  if (ddbImporterFlags) {
    ddbImporterFlags.resources = this.resourceChoices;
  } else {
    logger.warn("_generateResources: ddbimporter flags not present on character, unable to store resource choices");
  }
  this.raw.character.system.resources = result;
};

DDBCharacter.prototype.getResourceList = function getResourceList(this: DDBCharacter) {
  return this.getSortedByUsedResourceList();
};

DDBCharacter.prototype._generateResourceSelectionFromForm = function _generateResourceSelectionFromForm(this: DDBCharacter, formData: JQuery.NameValuePair[], type: string) {
  const primary = formData.find((r) => r.name === "primary-select" && r.value !== "");
  const secondary = formData.find((r) => r.name === "secondary-select" && r.value !== "");
  const tertiary = formData.find((r) => r.name === "tertiary-select" && r.value !== "");
  const ask = formData.find((r) => r.name === "ask-resources")?.value === "on";

  const resourceSelection = {
    type: type,
    primary: type === "custom" && primary ? primary.value : "",
    secondary: type === "custom" && secondary ? secondary.value : "",
    tertiary: type === "custom" && tertiary ? tertiary.value : "",
    ask: type === "remove" ? false : ask,
  };

  this.resourceChoices = resourceSelection;
};

DDBCharacter.prototype.setDefaultResources = function setDefaultResources(this: DDBCharacter, sortedResources: I5ePCResource[]) {
  if (sortedResources.length >= 1) {
    this.resourceChoices.primary = sortedResources[0].label ?? "";
  }
  if (sortedResources.length >= 2) {
    this.resourceChoices.secondary = sortedResources[1].label ?? "";
  }
  if (sortedResources.length >= 3) {
    this.resourceChoices.tertiary = sortedResources[2].label ?? "";
  }
};

interface IResourcesFormData extends I5ePCResource {
  primary?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
}

// this.source.ddb, this.raw.character
DDBCharacter.prototype.resourceSelectionDialog = async function resourceSelectionDialog(this: DDBCharacter): Promise<I5ePCData> {
  const sortedResources = this.getSortedByUsedResourceList();

  if (this.resourceChoices.type === "default") {
    this.setDefaultResources(sortedResources);
  }

  if (!(this.resourceChoices.ask || !foundry.utils.hasProperty(this.resourceChoices, "ask"))) {
    this._generateResources();
    return this.raw.character;
  }

  // we mutate the data here
  const resources = sortedResources.map((resource: IResourcesFormData): IResourcesFormData => {
    const resourceArray = [];
    if (resource.sr) resourceArray.push("SR");
    if (resource.lr) resourceArray.push("LR");
    if (!resource.sr && !resource.lr) resourceArray.push("Other");
    // resource.resetString = resourceArray.join(", ");
    switch (resource.label) {
      case this.resourceChoices.primary:
        resource.primary = true;
        break;
      case this.resourceChoices.secondary:
        resource.secondary = true;
        break;
      case this.resourceChoices.tertiary:
        resource.tertiary = true;
        break;
      // no default
    }
    return resource;
  });

  // resources.hbs reads its data from a `content` key, matching the legacy Dialog template context
  const dialogContent = await foundry.applications.handlebars.renderTemplate(
    "modules/ddb-importer/handlebars/resources.hbs",
    {
      content: {
        resources,
        character: this.raw.character.name,
        img: this.source?.ddb.character.decorations?.avatarUrl
          || CONFIG.DND5E.defaultArtwork.Actor.character,
        cssClass: "character-resource-selection sheet",
      },
    },
  );

  const applyForm = (form: HTMLFormElement | null, type: string) => {
    // DialogV2 wraps the template in its own <form>; serialize it as before
    const formData = $(form as HTMLFormElement).serializeArray();
    this._generateResourceSelectionFromForm(formData, type);
  };

  await foundry.applications.api.DialogV2.wait({
    window: { title: `Choose Resources for ${this.raw.character.name}` },
    content: dialogContent,
    position: { width: 400 },
    classes: ["character-resource-selection"],
    buttons: [
      {
        action: "default",
        label: "Auto",
        icon: "fas fa-check",
        default: true,
        callback: (_event: Event, button: HTMLButtonElement) => {
          applyForm(button.form, "default");
          this.setDefaultResources(sortedResources);
          this._generateResources();
        },
      },
      {
        action: "custom",
        label: "Custom",
        icon: "fas fa-book-open",
        callback: (_event: Event, button: HTMLButtonElement) => {
          applyForm(button.form, "custom");
        },
      },
      {
        action: "disable",
        label: "Disable",
        icon: "fas fa-times",
        callback: (_event: Event, button: HTMLButtonElement) => {
          applyForm(button.form, "disable");
          this._generateResources();
        },
      },
      {
        action: "remove",
        label: "Remove",
        icon: "fas fa-times",
        callback: (_event: Event, button: HTMLButtonElement) => {
          applyForm(button.form, "remove");
          this._generateResources();
        },
      },
    ],
    rejectClose: false,
  } as any);

  return this.raw.character;
};
