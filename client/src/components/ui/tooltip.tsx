// client/src/components/ui/tooltip.tsx
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

/** 開発を先に進めるための最小実装（デザインなし・素のRadixを再エクスポート） */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipContent = TooltipPrimitive.Content;

export default Tooltip;
