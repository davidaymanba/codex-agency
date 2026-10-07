import { CollectionPage } from "@/lib/dashboard/collection-page";

export const metadata = { title: "team" };

export default async function Page({ params }: PageProps<"/[locale]/dashboard/team">) {
  return <CollectionPage locale={(await params).locale} collection="team" sub="teamSub" />;
}
