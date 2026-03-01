import { mixins } from "../../enrichers/_module";


export interface ICompanionData {
  ddbParser: mixins.DDBEnricherFactoryMixin;
  document: any; // this.data,
  raw: string; // this.ddbDefinition.description,
  text: string; // this.data.system.description,
}


export interface IArcaneHandData extends ICompanionData {
  name?: string;
  postfix?: string;
}
