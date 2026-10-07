import { InviteForm } from "@/components/dashboard/auth/auth-forms";

/** Reached from the invite email (via /api/auth/confirm, which already signed the user in). */
export default function AcceptInvitePage() {
  return <InviteForm />;
}
