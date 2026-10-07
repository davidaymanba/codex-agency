"use client";

import { useTranslations } from "next-intl";
import type { z } from "zod";
import {
  COUNTRIES,
  SERVICE_SLUGS,
  serviceSchema,
  solutionSchema,
  statSchema,
  teamMemberSchema,
  techLogoSchema,
  testimonialSchema,
} from "@/lib/schemas/content";
import {
  ImageField,
  LocField,
  LocListField,
  QAListField,
  SelectField,
  SwitchField,
  TextField,
} from "../form/fields";

export type CollectionKey =
  "testimonials" | "team" | "stats" | "techLogos" | "services" | "solutions";

const L = { en: "", ar: "" };

function useT() {
  return useTranslations("dash");
}

function TestimonialFields() {
  const t = useT();
  return (
    <>
      <LocField name="quote" label={t("fields.quote")} multiline rows={4} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField name="author_name" label={t("fields.author_name")} />
        <TextField name="company" label={t("fields.company")} />
      </div>
      <LocField name="author_role" label={t("fields.author_role")} />
      <SelectField
        name="country"
        label={t("fields.country")}
        options={COUNTRIES.map((c) => ({ value: c, label: c }))}
      />
      <ImageField name="avatar_url" label={t("fields.avatar_url")} />
    </>
  );
}

function TeamFields() {
  const t = useT();
  return (
    <>
      <LocField name="name" label={t("fields.name")} />
      <LocField name="role" label={t("fields.role")} />
      <SelectField
        name="team"
        label={t("fields.team")}
        options={SERVICE_SLUGS.map((s) => ({ value: s, label: s }))}
      />
      <ImageField name="photo_url" label={t("fields.photo_url")} />
    </>
  );
}

function StatFields() {
  const t = useT();
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <TextField name="value" type="number" label={t("fields.value")} dir="ltr" />
        <TextField name="suffix" label={t("fields.suffix")} dir="ltr" hint="+ / %" />
        <TextField name="key" label={t("fields.key")} dir="ltr" />
      </div>
      <LocField name="label" label={t("fields.label")} />
    </>
  );
}

function LogoFields() {
  const t = useT();
  return (
    <>
      <TextField name="name" label={t("fields.name")} dir="ltr" />
      <TextField name="icon" label={t("fields.icon")} dir="ltr" hint="siShopify, siSalla, siN8n…" />
      <SelectField
        name="marquee_row"
        label={t("fields.marquee_row")}
        number
        options={[
          { value: 1, label: "1" },
          { value: 2, label: "2" },
        ]}
      />
    </>
  );
}

function ServiceFields() {
  const t = useT();
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          name="slug"
          label={t("fields.slug")}
          options={SERVICE_SLUGS.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          name="illustration"
          label={t("fields.illustration")}
          options={["code", "construction", "chart"].map((s) => ({ value: s, label: s }))}
        />
      </div>
      <LocField name="title" label={t("fields.title")} />
      <LocField name="tagline" label={t("fields.tagline")} />
      <LocField name="description" label={t("fields.description")} multiline />
      <LocListField name="sub_services" label={t("fields.sub_services")} />
      <LocField name="team_name" label={t("fields.team_name")} />
      <LocField name="team_description" label={t("fields.team_description")} multiline />
      <LocListField name="team_deliverables" label={t("fields.team_deliverables")} />
      <QAListField name="faqs" label={t("fields.faqs")} />
    </>
  );
}

function SolutionFields() {
  const t = useT();
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <TextField name="slug" label={t("fields.slug")} dir="ltr" />
        <SelectField
          name="kind"
          label={t("fields.kind")}
          options={[
            { value: "solution", label: "solution" },
            { value: "platform", label: "platform" },
          ]}
        />
        <TextField name="icon" label={t("fields.icon")} dir="ltr" hint={t("fields.iconHint")} />
      </div>
      <LocField name="title" label={t("fields.title")} />
      <LocField name="description" label={t("fields.description")} multiline />
      <LocListField name="features" label={t("fields.features")} />
    </>
  );
}

export const COLLECTION_FORMS: Record<
  CollectionKey,
  {
    schema: z.ZodType;
    empty: Record<string, unknown>;
    Fields: () => React.ReactNode;
    canCreate: boolean;
  }
> = {
  testimonials: {
    schema: testimonialSchema,
    Fields: TestimonialFields,
    canCreate: true,
    empty: {
      quote: L,
      author_name: "",
      author_role: L,
      company: "",
      country: "SA",
      avatar_url: "",
      published: true,
    },
  },
  team: {
    schema: teamMemberSchema,
    Fields: TeamFields,
    canCreate: true,
    empty: { name: L, role: L, team: "development", photo_url: "", published: true },
  },
  stats: {
    schema: statSchema,
    Fields: StatFields,
    canCreate: true,
    empty: { key: "", value: 0, suffix: "", label: L, published: true },
  },
  techLogos: {
    schema: techLogoSchema,
    Fields: LogoFields,
    canCreate: true,
    empty: { name: "", icon: "", marquee_row: 1, published: true },
  },
  services: {
    schema: serviceSchema,
    Fields: ServiceFields,
    canCreate: false,
    empty: {
      slug: "development",
      title: L,
      tagline: L,
      description: L,
      sub_services: [],
      illustration: "code",
      team_name: L,
      team_description: L,
      team_deliverables: [],
      faqs: [],
      published: true,
    },
  },
  solutions: {
    schema: solutionSchema,
    Fields: SolutionFields,
    canCreate: true,
    empty: {
      slug: "",
      kind: "solution",
      title: L,
      description: L,
      icon: "sparkles",
      features: [],
      published: true,
    },
  },
};

export { SwitchField };
