"use client";

import { Copy, MailPlus, MoreHorizontal, UserCheck, UserX, X } from "lucide-react";
import { useFormatter, useLocale, useNow, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  changeRole,
  inviteUser,
  revokeInvite,
  setUserActive,
} from "@/app/[locale]/dashboard/users/actions";
import type { Profile, Role } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { useDashUser } from "../shell/user-context";
import { DashButton } from "../ui/dash-button";
import {
  ConfirmDialog,
  Dialog,
  DialogContent,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "../ui/overlays";
import { Avatar, FieldError, Input, Label, NativeSelect } from "../ui/primitives";

type U = Pick<
  Profile,
  "id" | "email" | "full_name" | "role" | "active" | "invited_at" | "last_sign_in_at"
>;
const ROLES: Role[] = ["admin", "editor", "viewer"];
type Err = "forbidden" | "invalid" | "self" | "last_admin" | "exists" | "not_found";

/** Users & roles (admin): change roles, deactivate/reactivate, invite with a shareable link. */
export function UsersTable({ users }: { users: U[] }) {
  const t = useTranslations("dash");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const me = useDashUser();
  const router = useRouter();
  const [, start] = useTransition();
  const [invite, setInvite] = useState(false);
  const [confirm, setConfirm] = useState<U | null>(null);

  const errText = (e: Err) =>
    e === "self"
      ? t("users.selfError")
      : e === "last_admin"
        ? t("users.lastAdmin")
        : e === "exists"
          ? t("users.exists")
          : t("common.error");
  const run = (fn: () => Promise<{ ok: boolean; error?: Err }>, okMsg?: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (okMsg) toast(okMsg);
        router.refresh();
      } else toast.error(errText(r.error!));
    });

  const status = (u: U) => (u.invited_at ? "invited" : u.active ? "active" : "inactive");

  return (
    <>
      <div className="mb-4 flex justify-end">
        <DashButton variant="primary" onClick={() => setInvite(true)}>
          <MailPlus />
          {t("users.invite")}
        </DashButton>
      </div>
      <div className="overflow-x-auto border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs text-fg-muted">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t("users.name")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("users.role")}</th>
              <th className="px-4 py-3 text-start font-medium">{t("users.status")}</th>
              <th className="hidden px-4 py-3 text-start font-medium md:table-cell">
                {t("users.lastSeen")}
              </th>
              <th className="w-12 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const self = u.id === me.id;
              const s = status(u);
              return (
                <tr
                  key={u.id}
                  className={cn(
                    "border-b border-border last:border-b-0",
                    s === "inactive" && "opacity-60",
                  )}
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <Avatar name={u.full_name} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {u.full_name}{" "}
                          {self && (
                            <span className="ms-1 bg-surface-2 px-1 py-0.5 label-mono text-fg-muted">
                              {t("users.you")}
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-fg-muted" dir="ltr">
                          {u.email}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <NativeSelect
                      aria-label={t("users.role")}
                      value={u.role}
                      disabled={self}
                      onChange={(e) =>
                        run(() => changeRole(u.id, e.target.value), t("users.roleChanged"))
                      }
                      className="h-9 w-32"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {t(`users.roles.${r}`)}
                        </option>
                      ))}
                    </NativeSelect>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 label-mono",
                        s === "active"
                          ? "bg-blue-600 text-white"
                          : s === "invited"
                            ? "bg-yellow-200 text-navy-950"
                            : "bg-surface-2 text-fg-muted",
                      )}
                    >
                      {t(`users.${s}`)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-fg-muted md:table-cell">
                    {u.last_sign_in_at
                      ? format.relativeTime(new Date(u.last_sign_in_at), now)
                      : t("users.never")}
                  </td>
                  <td className="px-2 py-3">
                    {!self && (
                      <Menu>
                        <MenuTrigger asChild>
                          <DashButton
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${u.full_name} actions`}
                          >
                            <MoreHorizontal />
                          </DashButton>
                        </MenuTrigger>
                        <MenuContent>
                          {s === "invited" ? (
                            <MenuItem onSelect={() => run(() => revokeInvite(u.id))}>
                              <X />
                              {t("users.revoke")}
                            </MenuItem>
                          ) : s === "active" ? (
                            <MenuItem onSelect={() => setConfirm(u)}>
                              <UserX />
                              {t("users.deactivate")}
                            </MenuItem>
                          ) : (
                            <MenuItem onSelect={() => run(() => setUserActive(u.id, true))}>
                              <UserCheck />
                              {t("users.reactivate")}
                            </MenuItem>
                          )}
                        </MenuContent>
                      </Menu>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="mt-6 grid gap-3 md:grid-cols-3">
        {ROLES.map((r) => (
          <li key={r} className="border border-border bg-surface p-4">
            <p className="text-sm font-medium">{t(`users.roles.${r}`)}</p>
            <p className="mt-1 text-xs text-fg-muted">{t(`users.roleHelp.${r}`)}</p>
          </li>
        ))}
      </ul>

      <InviteDialog open={invite} onOpenChange={setInvite} onDone={() => router.refresh()} />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("users.deactivateTitle", { name: confirm?.full_name ?? "" })}
        body={t("users.deactivateBody")}
        confirmLabel={t("users.deactivate")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => confirm && run(() => setUserActive(confirm.id, false))}
      />
    </>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const t = useTranslations("dash");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setEmail("");
    setRole("editor");
    setLink(null);
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent title={t("users.inviteTitle")} description={t("users.inviteBody")}>
        {link ? (
          <div className="mt-5 space-y-3">
            <Label htmlFor="inv-link">{t("users.inviteLink")}</Label>
            <div className="flex gap-2">
              <Input
                id="inv-link"
                readOnly
                dir="ltr"
                value={new URL(link, location.origin).toString()}
              />
              <DashButton
                onClick={async () => {
                  await navigator.clipboard.writeText(new URL(link, location.origin).toString());
                  toast(t("media.copied"));
                }}
              >
                <Copy />
                {t("users.copyLink")}
              </DashButton>
            </div>
            <p className="text-xs text-fg-muted">{t("users.inviteLinkHint")}</p>
          </div>
        ) : (
          <form
            className="mt-5 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const r = await inviteUser(email, role, locale);
              setBusy(false);
              if (r.ok && r.data) {
                setLink(r.data);
                toast(t("users.inviteSent"));
                onDone();
              } else
                setError(
                  r.ok ? null : r.error === "exists" ? t("users.exists") : t("form.errors.invalid"),
                );
            }}
          >
            <div>
              <Label htmlFor="inv-email">{t("users.email")}</Label>
              <Input
                id="inv-email"
                type="email"
                dir="ltr"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rtl:text-end"
              />
              <FieldError>{error}</FieldError>
            </div>
            <fieldset>
              <legend className="mb-1.5 text-xs font-medium text-fg-muted">
                {t("users.role")}
              </legend>
              <div className="grid gap-2">
                {ROLES.map((r) => (
                  <label
                    key={r}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border p-3 transition-colors",
                      role === r
                        ? "border-primary bg-blue-100/50 dark:bg-blue-600/10"
                        : "border-border hover:border-border-strong",
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={() => setRole(r)}
                      className="mt-1 accent-[var(--primary)]"
                    />
                    <span>
                      <span className="block text-sm font-medium">{t(`users.roles.${r}`)}</span>
                      <span className="block text-xs text-fg-muted">
                        {t(`users.roleHelp.${r}`)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex justify-end">
              <DashButton type="submit" variant="primary" disabled={busy || !email}>
                <MailPlus />
                {t("users.invite")}
              </DashButton>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
