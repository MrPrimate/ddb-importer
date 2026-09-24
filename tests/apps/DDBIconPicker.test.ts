// @vitest-environment jsdom

import DDBIconPicker from "../../src/apps/DDBIconPicker";

function icon(path: string, name: string, extra: Partial<IIconCatalogEntry> = {}): IIconCatalogEntry {
  return { id: path, path, name, hash: "", tags: [], inferred: [], manual: [], ...extra };
}

const icons: IIconCatalogEntry[] = [
  ...Array.from({ length: 30 }, (_, i) => icon(`icons/magic/fire-${String(i).padStart(2, "0")}.webp`, "fire bolt")),
  icon("systems/dnd5e/icons/svg/damage/fire.svg", "Fire", { damage: true }),
  icon("icons/weapons/swords/sword-steel.webp", "sword steel"),
];

describe("DDBIconPicker", () => {
  let select: ReturnType<typeof vi.fn<(path: string) => void>>;
  let picker: DDBIconPicker;

  beforeEach(() => {
    select = vi.fn<(path: string) => void>();
    picker = new DDBIconPicker(select);
    (picker as any).render = vi.fn();
    (picker as any).close = vi.fn();
  });

  it("pages the whole catalogue when there is no query", () => {
    const first = picker._buildPage(icons);
    expect(first).toMatchObject({ count: icons.length, hasPrevious: false, hasNext: true });
    expect(first.icons).toHaveLength(DDBIconPicker.PAGE_SIZE);

    DDBIconPicker.nextPage.call(picker);
    const second = picker._buildPage(icons);
    expect(second.icons).toHaveLength(icons.length - DDBIconPicker.PAGE_SIZE);
    expect(second).toMatchObject({ hasPrevious: true, hasNext: false });
    expect(picker.render).toHaveBeenCalled();

    DDBIconPicker.previousPage.call(picker);
    expect(picker.offset).toBe(0);
  });

  it("filters by query and category", () => {
    picker.searchTerm = "sword";
    expect(picker._buildPage(icons).icons.map((result) => result.path)).toEqual([
      "icons/weapons/swords/sword-steel.webp",
    ]);

    picker.searchTerm = "";
    picker.filter = "damage";
    expect(picker._buildPage(icons).icons.map((result) => result.path)).toEqual([
      "systems/dnd5e/icons/svg/damage/fire.svg",
    ]);
  });

  it("moves back to the last page when a narrower search leaves the offset past the end", () => {
    picker.offset = DDBIconPicker.PAGE_SIZE;
    picker.searchTerm = "sword";
    const page = picker._buildPage(icons);
    expect(picker.offset).toBe(0);
    expect(page.icons).toHaveLength(1);
  });

  it("hands the chosen path to the editor and closes", () => {
    const target = document.createElement("button");
    target.dataset.path = "icons/weapons/swords/sword-steel.webp";
    DDBIconPicker.selectIcon.call(picker, new Event("click"), target);
    expect(select).toHaveBeenCalledWith("icons/weapons/swords/sword-steel.webp");
    expect(picker.close).toHaveBeenCalled();
  });
});
