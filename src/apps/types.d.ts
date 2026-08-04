export {};

global {

  interface IDDBTab extends foundry.applications.api.Application.Tab {
    tabs?: DeepPartial<IDDBTabs>;
  }

  type IDDBTabs = Record<string, DeepPartial<IDDBTab>>;

  interface NotifierV1Props {
    nameField?: boolean;
    monsterNote?: boolean;
    isError?: boolean;
    // some callers pass a boolean flag here; munchNote treats it as truthy only
    message?: string | boolean;
  }

  type NotifierV1 = ((note: any, { nameField, monsterNote, isError, message }?: NotifierV1Props) => void);

  interface NotifierV2Props {
    progress?: {
      current: number;
      total: number;
    };
    section?: string;
    message: string;
    suppress?: boolean;
    isError?: boolean;
    clear?: boolean;
    progressBar?: "primary" | "secondary" | "overall";
  }

  type INotifierV2 = ((props: NotifierV2Props) => void);

  interface DDBApplicationPart extends foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart {
    container?: {
      id: string;
      classes?: string[];
    };
  }

  interface DDBAppV2Context extends foundry.applications.api.Application.RenderContext {
    tabs?: IDDBTabs;
    tab?: Partial<IDDBTab>;
  }

  interface IMonsterReplacerData {
    id2014: number;
    name2014: string;
    id2024: number;
    name2024: string;
  }
};
