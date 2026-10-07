"use client";

import { X } from "lucide-react";
import { Dialog as D, DropdownMenu as M, Tooltip as T } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DashButton } from "./dash-button";

/* ---------------------------------------------------------------- Tooltip */

export function Tip({
  label,
  side = "top",
  children,
  disabled,
}: {
  label: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  children: ReactNode;
  disabled?: boolean;
}) {
  if (disabled) return <>{children}</>;
  return (
    <T.Root delayDuration={250}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={8}
          className="z-[80] bg-fg px-2.5 py-1.5 text-xs text-bg data-[state=delayed-open]:animate-[dash-menu-in_150ms_ease-out]"
        >
          {label}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}

export const TooltipProvider = T.Provider;

/* ---------------------------------------------------------------- Dropdown */

export const Menu = M.Root;
export const MenuTrigger = M.Trigger;

export function MenuContent({
  className,
  align = "end",
  ...props
}: ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        sideOffset={6}
        className={cn(
          "z-[80] min-w-48 border border-border bg-surface p-1 shadow-[0_16px_48px_-16px_color-mix(in_oklab,var(--color-navy-950)_35%,transparent)] data-[state=open]:animate-[dash-menu-in_160ms_cubic-bezier(0.16,1,0.3,1)]",
          className,
        )}
        {...props}
      />
    </M.Portal>
  );
}

export function MenuItem({ className, ...props }: ComponentProps<typeof M.Item>) {
  return (
    <M.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 px-2.5 py-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface-2 [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export function MenuCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof M.CheckboxItem>) {
  return (
    <M.CheckboxItem
      className={cn(
        "flex cursor-pointer items-center gap-2 px-2.5 py-2 text-sm outline-none select-none data-[highlighted]:bg-surface-2",
        className,
      )}
      {...props}
    >
      <span className="grid size-4 place-items-center border border-border-strong">
        <M.ItemIndicator>
          <span className="block size-2 bg-primary" />
        </M.ItemIndicator>
      </span>
      {children}
    </M.CheckboxItem>
  );
}

export const MenuSeparator = () => <M.Separator className="my-1 h-px bg-border" />;
export const MenuLabel = ({ children }: { children: ReactNode }) => (
  <M.Label className="px-2.5 py-1.5 text-xs text-fg-muted">{children}</M.Label>
);

/* ---------------------------------------------------------------- Dialog */

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

const overlayCls =
  "fixed inset-0 z-[70] bg-navy-950/50 backdrop-blur-[2px] data-[state=open]:animate-[dash-overlay-in_200ms_ease-out] data-[state=closed]:animate-[dash-overlay-out_150ms_ease-in]";

export function DialogContent({
  title,
  description,
  children,
  className,
  hideClose,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  hideClose?: boolean;
}) {
  return (
    <D.Portal>
      <D.Overlay className={overlayCls} />
      <D.Content
        className={cn(
          // Spring-like overshoot on open.
          "fixed top-1/2 left-1/2 z-[71] w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 border border-border bg-surface p-6 shadow-2xl outline-none data-[state=closed]:animate-[dash-pop-out_150ms_ease-in] data-[state=open]:animate-[dash-pop-in_280ms_cubic-bezier(0.34,1.56,0.64,1)]",
          className,
        )}
      >
        <D.Title className="text-base font-medium">{title}</D.Title>
        {description ? (
          <D.Description className="mt-1.5 text-sm text-fg-muted">{description}</D.Description>
        ) : (
          <D.Description className="sr-only">{title}</D.Description>
        )}
        {children}
        {!hideClose && (
          <D.Close asChild>
            <DashButton
              variant="ghost"
              size="icon-sm"
              className="absolute end-3 top-3"
              aria-label="Close"
            >
              <X />
            </DashButton>
          </D.Close>
        )}
      </D.Content>
    </D.Portal>
  );
}

/** Side panel ("sheet") that slides in from the inline-end edge (mirrors in RTL). */
export function SheetContent({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <D.Portal>
      <D.Overlay className={overlayCls} />
      <D.Content
        className={cn(
          "fixed inset-y-0 end-0 z-[71] flex w-[min(100vw,34rem)] flex-col border-s border-border bg-surface shadow-2xl outline-none data-[state=closed]:animate-[dash-sheet-out_200ms_ease-in] data-[state=open]:animate-[dash-sheet-in_320ms_cubic-bezier(0.16,1,0.3,1)]",
          className,
        )}
      >
        <D.Description className="sr-only">{title}</D.Description>
        {children}
      </D.Content>
    </D.Portal>
  );
}
export const SheetTitle = D.Title;

/** Confirmation dialog for destructive actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={body} hideClose>
        <div className="mt-6 flex justify-end gap-2">
          <D.Close asChild>
            <DashButton>{cancelLabel}</DashButton>
          </D.Close>
          <DashButton
            variant="warning"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </DashButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
