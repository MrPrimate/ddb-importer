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
    message?: string;
  }

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
  }

  interface DDBApplicationPart extends foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart {
    container?: {
      id: string;
      classes?: string[];
    };
  }

  interface DDBAppV2Context extends foundry.applications.api.Application.RenderContext {
    tabs: IDDBTabs;
  }
};
