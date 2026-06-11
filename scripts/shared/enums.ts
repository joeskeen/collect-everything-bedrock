import type { DisplaySlotId, ObjectiveSortOrder } from "@minecraft/server";

/**
 * Specifies a mechanism for displaying scores on a scoreboard.
 */
export const displaySlotIds = {
  /**
   * @remarks
   * Displays the score below the player's name.
   *
   */
  BelowName: "BelowName" as DisplaySlotId,
  /**
   * @remarks
   * Displays the score as a list on the pause screen.
   *
   */
  List: "List" as DisplaySlotId,
  /**
   * @remarks
   * Displays the score on the side of the player's screen.
   *
   */
  Sidebar: "Sidebar" as DisplaySlotId,
};

/**
 * Used for specifying a sort order for how to display an
 * objective and its list of participants.
 */
export const objectiveSortOrders: Record<string, ObjectiveSortOrder> = {
  /**
   * @remarks
   * Objective participant list is displayed in ascending (e.g.,
   * A-Z) order.
   *
   */
  Ascending: 0,
  /**
   * @remarks
   * Objective participant list is displayed in descending (e.g.,
   * Z-A) order.
   *
   */
  Descending: 1,
};
