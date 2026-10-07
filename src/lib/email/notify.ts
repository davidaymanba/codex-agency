import "server-only";
import { Resend } from "resend";
import type { Lead } from "@/lib/dashboard/types";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Emails the team about a new lead via Resend. No-op when RESEND_API_KEY / LEADS_NOTIFY_EMAIL
 * aren't configured. Never throws (a mail outage must not lose the lead).
 */
export async function notifyNewLead(lead: Lead, siteUrl: string) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEADS_NOTIFY_EMAIL;
  if (!key || !to) return;
  const link = `${siteUrl}/en/dashboard/leads?lead=${lead.id}`;
  try {
    await new Resend(key).emails.send({
      from: process.env.EMAIL_FROM ?? "CODEX <onboarding@resend.dev>",
      to: to.split(",").map((s) => s.trim()),
      replyTo: lead.email,
      subject: `New lead: ${lead.name} — ${lead.service}`,
      html: `<div style="font-family:Arial,sans-serif;color:#0E0F31">
        <p style="font-family:monospace;color:#4B4D83">{ new lead }</p>
        <h2 style="margin:0 0 12px">${esc(lead.name)}</h2>
        <p><b>Email:</b> ${esc(lead.email)}<br/><b>Phone:</b> ${esc(lead.phone)}<br/><b>Company:</b> ${esc(lead.company ?? "—")}<br/>
        <b>Service:</b> ${esc(lead.service)} · <b>Budget:</b> ${esc(lead.budget)}</p>
        <p style="white-space:pre-line;border-left:3px solid #0049B2;padding-left:12px" dir="auto">${esc(lead.message)}</p>
        <p><a href="${link}" style="background:#FFC100;color:#0E0F31;padding:10px 16px;text-decoration:none;font-weight:bold">Open in dashboard</a></p></div>`,
    });
  } catch (e) {
    console.error("[notifyNewLead]", e);
  }
}

/** Branded invitation email via Resend. Returns false when email isn't configured (link is shown instead). */
export async function sendInviteEmail(to: string, link: string, locale: "en" | "ar"): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const ar = locale === "ar";
  try {
    const { error } = await new Resend(key).emails.send({
      from: process.env.EMAIL_FROM ?? "CODEX <onboarding@resend.dev>",
      to,
      subject: ar ? "دعوة للانضمام إلى لوحة تحكم CODEX" : "You're invited to the CODEX dashboard",
      html: `<div dir="${ar ? "rtl" : "ltr"}" style="font-family:Arial,sans-serif;color:#0E0F31;max-width:520px">
        <div style="background:#0E0F31;color:#F2F3FF;padding:20px 28px;font-weight:bold;letter-spacing:4px">CODEX</div>
        <div style="padding:28px;border:1px solid #C5C6E3;border-top:0">
          <h2 style="margin:0 0 12px">${ar ? "تمت دعوتك" : "You're invited"}</h2>
          <p style="color:#4B4D83">${ar ? "اضغط الزر لإدخال اسمك وكلمة المرور." : "Use the button to set your name and password."}</p>
          <a href="${link}" style="display:inline-block;background:#FFC100;color:#0E0F31;padding:12px 18px;font-weight:bold;text-decoration:none">${ar ? "قبول الدعوة" : "Accept invitation"}</a>
        </div></div>`,
    });
    return !error;
  } catch {
    return false;
  }
}
