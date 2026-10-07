
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "activity_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"entity": string,"entity_id": string | null,"id": number,"meta": NonNullable<Json>,"summary": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"entity": string,"entity_id"?: string | null,"id"?: never,"meta"?: NonNullable<Json>,"summary": string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"entity"?: string,"entity_id"?: string | null,"id"?: never,"meta"?: NonNullable<Json>,"summary"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_log_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lead_notes": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"id": string,"kind": string,"lead_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"id"?: string,"kind"?: string,"lead_id": string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"lead_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lead_notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lead_notes_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"leads": {
                  Row: {
                    "assigned_to": string | null,"budget": string,"company": string | null,"country": string | null,"created_at": string,"email": string,"estimated_value": number | null,"id": string,"locale": string,"message": string,"name": string,"phone": string,"position": number,"service": string,"source_page": string | null,"status": Database["public"]['Enums']["lead_status"],"updated_at": string,"utm": Json | null
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_to"?: string | null,"budget": string,"company"?: string | null,"country"?: string | null,"created_at"?: string,"email": string,"estimated_value"?: number | null,"id"?: string,"locale"?: string,"message": string,"name": string,"phone": string,"position"?: number,"service": string,"source_page"?: string | null,"status"?: Database["public"]['Enums']["lead_status"],"updated_at"?: string,"utm"?: Json | null
                  }
                  Update: {
                    "assigned_to"?: string | null,"budget"?: string,"company"?: string | null,"country"?: string | null,"created_at"?: string,"email"?: string,"estimated_value"?: number | null,"id"?: string,"locale"?: string,"message"?: string,"name"?: string,"phone"?: string,"position"?: number,"service"?: string,"source_page"?: string | null,"status"?: Database["public"]['Enums']["lead_status"],"updated_at"?: string,"utm"?: Json | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "leads_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"media": {
                  Row: {
                    "alt_ar": string,"alt_en": string,"bucket": string,"created_at": string,"filename": string,"id": string,"mime": string,"path": string,"size": number,"uploaded_by": string | null,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_ar"?: string,"alt_en"?: string,"bucket"?: string,"created_at"?: string,"filename": string,"id"?: string,"mime": string,"path": string,"size": number,"uploaded_by"?: string | null,"url": string
                  }
                  Update: {
                    "alt_ar"?: string,"alt_en"?: string,"bucket"?: string,"created_at"?: string,"filename"?: string,"id"?: string,"mime"?: string,"path"?: string,"size"?: number,"uploaded_by"?: string | null,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"page_views": {
                  Row: {
                    "country": string | null,"created_at": string,"device": string,"id": number,"locale": string,"path": string,"referrer": string,"session_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "country"?: string | null,"created_at"?: string,"device": string,"id"?: never,"locale": string,"path": string,"referrer"?: string,"session_hash": string
                  }
                  Update: {
                    "country"?: string | null,"created_at"?: string,"device"?: string,"id"?: never,"locale"?: string,"path"?: string,"referrer"?: string,"session_hash"?: string
                  }
                  Relationships: [
                    
                  ]
                },"posts": {
                  Row: {
                    "author_name": string,"content_ar": NonNullable<Json>,"content_en": NonNullable<Json>,"cover_image": string | null,"cover_style": string,"created_at": string,"excerpt_ar": string,"excerpt_en": string,"id": string,"published_at": string,"reading_minutes": number,"seo_description_ar": string,"seo_description_en": string,"seo_title_ar": string,"seo_title_en": string,"slug": string,"status": Database["public"]['Enums']["post_status"],"tags": (string)[],"title_ar": string,"title_en": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_name"?: string,"content_ar"?: NonNullable<Json>,"content_en"?: NonNullable<Json>,"cover_image"?: string | null,"cover_style"?: string,"created_at"?: string,"excerpt_ar"?: string,"excerpt_en"?: string,"id"?: string,"published_at"?: string,"reading_minutes"?: number,"seo_description_ar"?: string,"seo_description_en"?: string,"seo_title_ar"?: string,"seo_title_en"?: string,"slug": string,"status"?: Database["public"]['Enums']["post_status"],"tags"?: (string)[],"title_ar": string,"title_en": string,"updated_at"?: string
                  }
                  Update: {
                    "author_name"?: string,"content_ar"?: NonNullable<Json>,"content_en"?: NonNullable<Json>,"cover_image"?: string | null,"cover_style"?: string,"created_at"?: string,"excerpt_ar"?: string,"excerpt_en"?: string,"id"?: string,"published_at"?: string,"reading_minutes"?: number,"seo_description_ar"?: string,"seo_description_en"?: string,"seo_title_ar"?: string,"seo_title_en"?: string,"slug"?: string,"status"?: Database["public"]['Enums']["post_status"],"tags"?: (string)[],"title_ar"?: string,"title_en"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "active": boolean,"avatar_url": string | null,"created_at": string,"email": string,"full_name": string,"id": string,"invited_at": string | null,"language": string,"last_sign_in_at": string | null,"role": Database["public"]['Enums']["user_role"],"theme": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"avatar_url"?: string | null,"created_at"?: string,"email": string,"full_name"?: string,"id": string,"invited_at"?: string | null,"language"?: string,"last_sign_in_at"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"theme"?: string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"avatar_url"?: string | null,"created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string,"invited_at"?: string | null,"language"?: string,"last_sign_in_at"?: string | null,"role"?: Database["public"]['Enums']["user_role"],"theme"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"project_categories": {
                  Row: {
                    "created_at": string,"id": string,"name_ar": string,"name_en": string,"slug": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name_ar": string,"name_en": string,"slug": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name_ar"?: string,"name_en"?: string,"slug"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"projects": {
                  Row: {
                    "approach_ar": string,"approach_en": string,"category": string,"challenge_ar": string,"challenge_en": string,"client_name": string,"content_ar": Json | null,"content_en": Json | null,"cover_image": string | null,"cover_style": string,"created_at": string,"featured": boolean,"gallery": (string)[],"id": string,"live_url": string | null,"results": NonNullable<Json>,"seo_description_ar": string,"seo_description_en": string,"seo_title_ar": string,"seo_title_en": string,"services": (string)[],"slug": string,"sort_order": number,"status": Database["public"]['Enums']["content_status"],"summary_ar": string,"summary_en": string,"tags": (string)[],"title_ar": string,"title_en": string,"updated_at": string,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "approach_ar"?: string,"approach_en"?: string,"category": string,"challenge_ar"?: string,"challenge_en"?: string,"client_name"?: string,"content_ar"?: Json | null,"content_en"?: Json | null,"cover_image"?: string | null,"cover_style"?: string,"created_at"?: string,"featured"?: boolean,"gallery"?: (string)[],"id"?: string,"live_url"?: string | null,"results"?: NonNullable<Json>,"seo_description_ar"?: string,"seo_description_en"?: string,"seo_title_ar"?: string,"seo_title_en"?: string,"services"?: (string)[],"slug": string,"sort_order"?: number,"status"?: Database["public"]['Enums']["content_status"],"summary_ar"?: string,"summary_en"?: string,"tags"?: (string)[],"title_ar": string,"title_en": string,"updated_at"?: string,"year"?: number
                  }
                  Update: {
                    "approach_ar"?: string,"approach_en"?: string,"category"?: string,"challenge_ar"?: string,"challenge_en"?: string,"client_name"?: string,"content_ar"?: Json | null,"content_en"?: Json | null,"cover_image"?: string | null,"cover_style"?: string,"created_at"?: string,"featured"?: boolean,"gallery"?: (string)[],"id"?: string,"live_url"?: string | null,"results"?: NonNullable<Json>,"seo_description_ar"?: string,"seo_description_en"?: string,"seo_title_ar"?: string,"seo_title_en"?: string,"services"?: (string)[],"slug"?: string,"sort_order"?: number,"status"?: Database["public"]['Enums']["content_status"],"summary_ar"?: string,"summary_en"?: string,"tags"?: (string)[],"title_ar"?: string,"title_en"?: string,"updated_at"?: string,"year"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_category_fkey"
      columns: ["category"]
isOneToOne: false
      referencedRelation: "project_categories"
      referencedColumns: ["slug"]
    }
                  ]
                },"rate_limits": {
                  Row: {
                    "hit_at": string,"key": string
                  }
                  ComputedFields: never
                  Insert: {
                    "hit_at"?: string,"key": string
                  }
                  Update: {
                    "hit_at"?: string,"key"?: string
                  }
                  Relationships: [
                    
                  ]
                },"services": {
                  Row: {
                    "created_at": string,"description_ar": string,"description_en": string,"faqs": NonNullable<Json>,"icon": string,"id": string,"illustration": string,"published": boolean,"slug": string,"sort_order": number,"sub_services": NonNullable<Json>,"tagline_ar": string,"tagline_en": string,"team_deliverables": NonNullable<Json>,"team_description_ar": string,"team_description_en": string,"team_name_ar": string,"team_name_en": string,"title_ar": string,"title_en": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description_ar"?: string,"description_en"?: string,"faqs"?: NonNullable<Json>,"icon"?: string,"id"?: string,"illustration"?: string,"published"?: boolean,"slug": string,"sort_order"?: number,"sub_services"?: NonNullable<Json>,"tagline_ar"?: string,"tagline_en"?: string,"team_deliverables"?: NonNullable<Json>,"team_description_ar"?: string,"team_description_en"?: string,"team_name_ar"?: string,"team_name_en"?: string,"title_ar": string,"title_en": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description_ar"?: string,"description_en"?: string,"faqs"?: NonNullable<Json>,"icon"?: string,"id"?: string,"illustration"?: string,"published"?: boolean,"slug"?: string,"sort_order"?: number,"sub_services"?: NonNullable<Json>,"tagline_ar"?: string,"tagline_en"?: string,"team_deliverables"?: NonNullable<Json>,"team_description_ar"?: string,"team_description_en"?: string,"team_name_ar"?: string,"team_name_en"?: string,"title_ar"?: string,"title_en"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"site_settings": {
                  Row: {
                    "address_ar": string,"address_en": string,"announcement_ar": string,"announcement_en": string,"announcement_enabled": boolean,"announcement_href": string,"email": string,"id": number,"maintenance": boolean,"phone": string,"seo_description_ar": string,"seo_description_en": string,"seo_title_ar": string,"seo_title_en": string,"socials": NonNullable<Json>,"updated_at": string,"whatsapp": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address_ar"?: string,"address_en"?: string,"announcement_ar"?: string,"announcement_en"?: string,"announcement_enabled"?: boolean,"announcement_href"?: string,"email"?: string,"id"?: number,"maintenance"?: boolean,"phone"?: string,"seo_description_ar"?: string,"seo_description_en"?: string,"seo_title_ar"?: string,"seo_title_en"?: string,"socials"?: NonNullable<Json>,"updated_at"?: string,"whatsapp"?: string
                  }
                  Update: {
                    "address_ar"?: string,"address_en"?: string,"announcement_ar"?: string,"announcement_en"?: string,"announcement_enabled"?: boolean,"announcement_href"?: string,"email"?: string,"id"?: number,"maintenance"?: boolean,"phone"?: string,"seo_description_ar"?: string,"seo_description_en"?: string,"seo_title_ar"?: string,"seo_title_en"?: string,"socials"?: NonNullable<Json>,"updated_at"?: string,"whatsapp"?: string
                  }
                  Relationships: [
                    
                  ]
                },"solutions": {
                  Row: {
                    "created_at": string,"description_ar": string,"description_en": string,"features": NonNullable<Json>,"icon": string,"id": string,"kind": string,"published": boolean,"slug": string,"sort_order": number,"title_ar": string,"title_en": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description_ar"?: string,"description_en"?: string,"features"?: NonNullable<Json>,"icon"?: string,"id"?: string,"kind"?: string,"published"?: boolean,"slug": string,"sort_order"?: number,"title_ar": string,"title_en": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description_ar"?: string,"description_en"?: string,"features"?: NonNullable<Json>,"icon"?: string,"id"?: string,"kind"?: string,"published"?: boolean,"slug"?: string,"sort_order"?: number,"title_ar"?: string,"title_en"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"stats": {
                  Row: {
                    "created_at": string,"id": string,"key": string,"label_ar": string,"label_en": string,"published": boolean,"sort_order": number,"suffix": string,"updated_at": string,"value": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"key": string,"label_ar": string,"label_en": string,"published"?: boolean,"sort_order"?: number,"suffix"?: string,"updated_at"?: string,"value": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"key"?: string,"label_ar"?: string,"label_en"?: string,"published"?: boolean,"sort_order"?: number,"suffix"?: string,"updated_at"?: string,"value"?: number
                  }
                  Relationships: [
                    
                  ]
                },"team_members": {
                  Row: {
                    "created_at": string,"id": string,"name_ar": string,"name_en": string,"photo_url": string | null,"published": boolean,"role_ar": string,"role_en": string,"sort_order": number,"team": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name_ar": string,"name_en": string,"photo_url"?: string | null,"published"?: boolean,"role_ar"?: string,"role_en"?: string,"sort_order"?: number,"team": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name_ar"?: string,"name_en"?: string,"photo_url"?: string | null,"published"?: boolean,"role_ar"?: string,"role_en"?: string,"sort_order"?: number,"team"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tech_logos": {
                  Row: {
                    "created_at": string,"icon": string | null,"id": string,"marquee_row": number,"name": string,"published": boolean,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"icon"?: string | null,"id"?: string,"marquee_row"?: number,"name": string,"published"?: boolean,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"icon"?: string | null,"id"?: string,"marquee_row"?: number,"name"?: string,"published"?: boolean,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"testimonials": {
                  Row: {
                    "author_name": string,"author_role_ar": string,"author_role_en": string,"avatar_url": string | null,"company": string,"country": string,"created_at": string,"id": string,"published": boolean,"quote_ar": string,"quote_en": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_name": string,"author_role_ar"?: string,"author_role_en"?: string,"avatar_url"?: string | null,"company"?: string,"country"?: string,"created_at"?: string,"id"?: string,"published"?: boolean,"quote_ar": string,"quote_en": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "author_name"?: string,"author_role_ar"?: string,"author_role_en"?: string,"avatar_url"?: string | null,"company"?: string,"country"?: string,"created_at"?: string,"id"?: string,"published"?: boolean,"quote_ar"?: string,"quote_en"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "analytics_breakdown":
{ Args: { "p_days": number,"p_dimension": string }; Returns: {
              "label": string,"value": number
            }[]
                           },
"analytics_daily":
{ Args: { "p_days": number }; Returns: {
              "contact_views": number,"day": string,"views": number,"visitors": number
            }[]
                           },
"auth_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["user_role"]
                           },
"has_role":
{ Args: { "min_role": Database["public"]['Enums']["user_role"] }; Returns: boolean
                           },
"rate_limit_clear":
{ Args: { "p_key": string }; Returns: undefined
                           },
"rate_limit_hit":
{ Args: { "p_key": string,"p_max": number,"p_window_seconds": number }; Returns: boolean
                           },
"update_my_preferences":
{ Args: { "p_language": string,"p_theme": string }; Returns: undefined
                           }
          }
          Enums: {
            "content_status": "draft"|"published","lead_status": "new"|"contacted"|"qualified"|"proposal"|"won"|"lost","post_status": "draft"|"scheduled"|"published","user_role": "viewer"|"editor"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "content_status": ["draft", "published"],"lead_status": ["new", "contacted", "qualified", "proposal", "won", "lost"],"post_status": ["draft", "scheduled", "published"],"user_role": ["viewer", "editor", "admin"]
          }
        }
} as const
