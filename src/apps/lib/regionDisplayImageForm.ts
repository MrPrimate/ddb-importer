import DDBIconPicker from "../DDBIconPicker";
import { isImagePattern, REGION_DISPLAY_TEXTURE_CHOICES } from "../../config/regionDisplayProfiles";
import RegionDisplayProfiles from "../../lib/RegionDisplayProfiles";

/** The same image controls serve profiles and nullable per-document overrides. */
export function imageFormContext(
  style: IRegionDisplayProfile | IRegionDisplayStyle | null,
  draft: IRegionDisplayFlag,
  inherit: boolean,
) {
  const options = (values: readonly string[], selected: string | null | undefined, prefix: string) => [
    ...(inherit ? [{ value: "", label: RegionDisplayProfiles.localize("profileDefault"), selected: !selected }] : []),
    ...values.map((value) => ({
      value,
      label: RegionDisplayProfiles.localize(`texture.${prefix}${value}`),
      selected: value === selected,
    })),
  ];
  return {
    showTexture: isImagePattern(style?.pattern),
    showTextureFit: style?.pattern === "imageStretch",
    showTextureAnchor: isImagePattern(style?.pattern) && style?.pattern !== "imageStretch",
    textureSrc: draft.textureSrc ?? "",
    texturePlaceholder: inherit ? style?.textureSrc : "",
    textureColorOptions: options(REGION_DISPLAY_TEXTURE_CHOICES.textureColorMode, draft.textureColorMode, ""),
    textureAnchorOptions: options(REGION_DISPLAY_TEXTURE_CHOICES.textureAnchor, draft.textureAnchor, "anchor."),
    textureFitOptions: options(REGION_DISPLAY_TEXTURE_CHOICES.textureFit, draft.textureFit, "fit."),
  };
}

/** Listeners live on the stable frame; picker callbacks locate the current input after a rerender. */
export function bindImagePicker(element: HTMLElement): void {
  if (element.dataset.ddbiImageBound) return;
  element.dataset.ddbiImageBound = "true";
  element.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest("[data-image-search], [data-image-browse]");
    if (!button) return;
    event.preventDefault();
    const choose = (src: string) => {
      if (!element.isConnected) return;
      const input = element.querySelector<HTMLInputElement>("input[name=textureSrc]");
      if (!input) return;
      input.value = src;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    if (button.hasAttribute("data-image-search")) {
      new DDBIconPicker(choose).render({ force: true });
    } else {
      const Picker = foundry.applications.apps.FilePicker.implementation as unknown as new (options: {
        type: string;
        current: string;
        callback: (path: string) => void;
      }) => { render(force: boolean): unknown };
      new Picker({
        type: "image",
        current: element.querySelector<HTMLInputElement>("input[name=textureSrc]")?.value ?? "",
        callback: choose,
      }).render(true);
    }
  });
}

/** Registered by the template loader before either editor renders its shared image controls. */
export function loadImageFormTemplate(): Promise<unknown> {
  return foundry.applications.handlebars.loadTemplates([
    "modules/ddb-importer/handlebars/region-display/image-fields.hbs",
  ]);
}
