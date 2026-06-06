import { InjectionToken } from "tsyringe";
import { Runnable } from "../shared/runnable";

export type CollectFn = (what: string) => void;
export const COLLECT_FN: InjectionToken<{ collect: CollectFn }> = Symbol(
  "Access to the function for collecting something"
);

export const COLLECTORS_TOKEN: InjectionToken<Runnable> = Symbol("All player-scoped collectors");
