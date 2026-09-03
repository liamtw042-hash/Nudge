import * as Haptics from 'expo-haptics';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const quiet = () => undefined;

/** Small physical events. Each one is a different shape so they don't blur. */
export const haptic = {
  /** A control was touched. */
  tap: () => Haptics.selectionAsync().catch(quiet),
  /** A step was done. */
  done: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(quiet),
  /** A step was done and the reward is small or silent. */
  soft: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(quiet),
  /** The occasional bigger one: a heavy knock, then two lighter ones. */
  big: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(quiet);
    await wait(130);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(quiet);
    await wait(130);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(quiet);
  },
  /** The routine is over. */
  finish: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(quiet);
    await wait(220);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(quiet);
  },
};
