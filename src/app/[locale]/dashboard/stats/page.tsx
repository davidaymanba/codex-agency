import { CollectionPage } from "@/lib/dashboard/collection-page";

export const metadata = { title: "stats" };

export default async function Page({ params }: PageProps<"/[locale]/dashboard/stats">) {
  return <CollectionPage locale={(await params).locale} collection="stats" sub="statsSub" />;
}
