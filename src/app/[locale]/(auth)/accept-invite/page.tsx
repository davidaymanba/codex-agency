import { InviteForm } from "@/components/dashboard/auth/auth-forms";

export default async function AcceptInvitePage({
  searchParams,
}: PageProps<"/[locale]/accept-invite">) {
  const token = (await searchParams).token;
  return <InviteForm token={typeof token === "string" ? token : ""} />;
}
