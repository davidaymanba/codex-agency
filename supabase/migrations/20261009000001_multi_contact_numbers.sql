-- =============================================================================
-- CODEX · 009 · Several contact numbers
-- `phone` and `whatsapp` hold comma-separated lists ("+20 120 780 9980, +20 102 902 0716" /
-- "201207809980,201029020716"). The site shows every number; the WhatsApp button lets the
-- visitor pick one.
-- =============================================================================

alter table public.site_settings drop constraint if exists site_settings_whatsapp_check;
alter table public.site_settings
  add constraint site_settings_whatsapp_check
  check (whatsapp ~ '^([0-9]{8,15}(,[0-9]{8,15}){0,3})?$');
alter table public.site_settings
  add constraint site_settings_phone_check check (char_length(phone) <= 120);
