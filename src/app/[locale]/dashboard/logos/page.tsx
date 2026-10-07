import { CollectionPage } from "@/lib/dashboard/collection-page";

export const metadata = { title: "techLogos" };

export default async function Page({ params }: PageProps<"/[locale]/dashboard/logos">) {
  return (
    <CollectionPage locale={(await params).locale} collection="techLogos" sub="techLogosSub" />
  );
}
