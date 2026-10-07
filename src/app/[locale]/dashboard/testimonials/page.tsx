import { CollectionPage } from "@/lib/dashboard/collection-page";

export const metadata = { title: "testimonials" };

export default async function Page({ params }: PageProps<"/[locale]/dashboard/testimonials">) {
  return (
    <CollectionPage
      locale={(await params).locale}
      collection="testimonials"
      sub="testimonialsSub"
    />
  );
}
