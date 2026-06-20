import { InjectionToken } from "tsyringe";
import type { CustomForm, ObservableString, ObservableBoolean, ObservableNumber } from "@minecraft/server-ui";

export type DDUI = {
  CustomForm: typeof CustomForm;
  ObservableBoolean: typeof ObservableBoolean;
  ObservableNumber: typeof ObservableNumber;
  ObservableString: typeof ObservableString;
};

export const DDUI_TOKEN: InjectionToken<DDUI> = Symbol("access to DDUI components of the @minecraft/server package");
