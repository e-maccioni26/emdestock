
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
            "admin_notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"id": string,"read_at": string | null,"ref_id": string,"title": string,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"read_at"?: string | null,"ref_id": string,"title": string,"type": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"read_at"?: string | null,"ref_id"?: string,"title"?: string,"type"?: string
                  }
                  Relationships: [
                    
                  ]
                },"banner_products": {
                  Row: {
                    "banner_id": string,"product_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "banner_id": string,"product_id": string
                  }
                  Update: {
                    "banner_id"?: string,"product_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "banner_products_banner_id_fkey"
      columns: ["banner_id"]
isOneToOne: false
      referencedRelation: "banners"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "banner_products_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"banners": {
                  Row: {
                    "audience": Database["public"]['Enums']["banner_audience"],"created_at": string,"cta_label": string,"ends_at": string,"eyebrow": string,"id": string,"image_path": string | null,"position": number,"starts_at": string,"target_id": string | null,"target_type": Database["public"]['Enums']["banner_target"],"theme": Database["public"]['Enums']["banner_theme"],"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "audience"?: Database["public"]['Enums']["banner_audience"],"created_at"?: string,"cta_label": string,"ends_at": string,"eyebrow": string,"id"?: string,"image_path"?: string | null,"position"?: number,"starts_at": string,"target_id"?: string | null,"target_type": Database["public"]['Enums']["banner_target"],"theme"?: Database["public"]['Enums']["banner_theme"],"title": string
                  }
                  Update: {
                    "audience"?: Database["public"]['Enums']["banner_audience"],"created_at"?: string,"cta_label"?: string,"ends_at"?: string,"eyebrow"?: string,"id"?: string,"image_path"?: string | null,"position"?: number,"starts_at"?: string,"target_id"?: string | null,"target_type"?: Database["public"]['Enums']["banner_target"],"theme"?: Database["public"]['Enums']["banner_theme"],"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"brands": {
                  Row: {
                    "id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string
                  }
                  Update: {
                    "id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "id": string,"name": string,"parent_id": string | null,"position": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string,"parent_id"?: string | null,"position"?: number
                  }
                  Update: {
                    "id"?: string,"name"?: string,"parent_id"?: string | null,"position"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"companies": {
                  Row: {
                    "address": string,"city": string,"created_at": string,"id": string,"is_former_client": boolean,"legal_name": string,"phone": string | null,"postal_code": string,"siret": string,"status": Database["public"]['Enums']["company_status"],"validated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"city": string,"created_at"?: string,"id"?: string,"is_former_client"?: boolean,"legal_name": string,"phone"?: string | null,"postal_code": string,"siret": string,"status"?: Database["public"]['Enums']["company_status"],"validated_at"?: string | null
                  }
                  Update: {
                    "address"?: string,"city"?: string,"created_at"?: string,"id"?: string,"is_former_client"?: boolean,"legal_name"?: string,"phone"?: string | null,"postal_code"?: string,"siret"?: string,"status"?: Database["public"]['Enums']["company_status"],"validated_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"order_counters": {
                  Row: {
                    "last_value": number,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "last_value": number,"year": number
                  }
                  Update: {
                    "last_value"?: number,"year"?: number
                  }
                  Relationships: [
                    
                  ]
                },"order_events": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"order_id": string,"payload": NonNullable<Json>,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"order_id": string,"payload"?: NonNullable<Json>,"type": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"order_id"?: string,"payload"?: NonNullable<Json>,"type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_events_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_events_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "ean": string,"id": string,"line_total_ht": number,"order_id": string,"product_id": string | null,"quantity": number,"reference": string,"title": string,"unit_price_ht": number
                  }
                  ComputedFields: never
                  Insert: {
                    "ean": string,"id"?: string,"line_total_ht": number,"order_id": string,"product_id"?: string | null,"quantity": number,"reference": string,"title": string,"unit_price_ht": number
                  }
                  Update: {
                    "ean"?: string,"id"?: string,"line_total_ht"?: number,"order_id"?: string,"product_id"?: string | null,"quantity"?: number,"reference"?: string,"title"?: string,"unit_price_ht"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "company_id": string,"created_at": string,"created_by": string | null,"id": string,"message": string | null,"number": string,"status": Database["public"]['Enums']["order_status"],"store_id": string,"total_ht": number,"units": number,"updated_at": string,"viewed_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"message"?: string | null,"number": string,"status"?: Database["public"]['Enums']["order_status"],"store_id": string,"total_ht": number,"units": number,"updated_at"?: string,"viewed_at"?: string | null
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"message"?: string | null,"number"?: string,"status"?: Database["public"]['Enums']["order_status"],"store_id"?: string,"total_ht"?: number,"units"?: number,"updated_at"?: string,"viewed_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"product_images": {
                  Row: {
                    "created_at": string,"id": string,"path": string,"position": number,"product_id": string,"thumb_path": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"path": string,"position"?: number,"product_id": string,"thumb_path"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"path"?: string,"position"?: number,"product_id"?: string,"thumb_path"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_images_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "body": string | null,"brand_id": string | null,"category_id": string | null,"created_at": string,"description": string | null,"ean": string,"id": string,"is_visible": boolean,"placeholder_shape": Database["public"]['Enums']["placeholder_shape"],"price_ht": number,"reference": string,"search": string | null,"stock": number,"title": string,"updated_at": string,"weight_kg": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"brand_id"?: string | null,"category_id"?: string | null,"created_at"?: string,"description"?: string | null,"ean": string,"id"?: string,"is_visible"?: boolean,"placeholder_shape"?: Database["public"]['Enums']["placeholder_shape"],"price_ht": number,"reference": string,"search"?: never,"stock"?: number,"title": string,"updated_at"?: string,"weight_kg"?: number | null
                  }
                  Update: {
                    "body"?: string | null,"brand_id"?: string | null,"category_id"?: string | null,"created_at"?: string,"description"?: string | null,"ean"?: string,"id"?: string,"is_visible"?: boolean,"placeholder_shape"?: Database["public"]['Enums']["placeholder_shape"],"price_ht"?: number,"reference"?: string,"search"?: never,"stock"?: number,"title"?: string,"updated_at"?: string,"weight_kg"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_brand_id_fkey"
      columns: ["brand_id"]
isOneToOne: false
      referencedRelation: "brands"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "company_id": string | null,"created_at": string,"email": string,"first_name": string,"id": string,"last_name": string,"phone": string | null,"role": Database["public"]['Enums']["user_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string | null,"created_at"?: string,"email": string,"first_name": string,"id": string,"last_name": string,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "company_id"?: string | null,"created_at"?: string,"email"?: string,"first_name"?: string,"id"?: string,"last_name"?: string,"phone"?: string | null,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                },"stores": {
                  Row: {
                    "address": string,"archived_at": string | null,"city": string,"company_id": string,"created_at": string,"id": string,"name": string,"postal_code": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"archived_at"?: string | null,"city": string,"company_id": string,"created_at"?: string,"id"?: string,"name": string,"postal_code": string
                  }
                  Update: {
                    "address"?: string,"archived_at"?: string | null,"city"?: string,"company_id"?: string,"created_at"?: string,"id"?: string,"name"?: string,"postal_code"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stores_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_stats":
{ Args: { "p_period": string,"p_ref"?: string }; Returns: Json
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"my_banners":
{ Args: Record<PropertyKey, never>; Returns: {
              "audience": Database["public"]['Enums']["banner_audience"],
"created_at": string,
"cta_label": string,
"ends_at": string,
"eyebrow": string,
"id": string,
"image_path": string | null,
"position": number,
"starts_at": string,
"target_id": string | null,
"target_type": Database["public"]['Enums']["banner_target"],
"theme": Database["public"]['Enums']["banner_theme"],
"title": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "banners"
        isOneToOne: false
        isSetofReturn: true
      } },
"my_company_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"my_company_is_active":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"place_order":
{ Args: { "p_items": Json,"p_message": string,"p_store": string }; Returns: {
              "company_id": string,
"created_at": string,
"created_by": string | null,
"id": string,
"message": string | null,
"number": string,
"status": Database["public"]['Enums']["order_status"],
"store_id": string,
"total_ht": number,
"units": number,
"updated_at": string,
"viewed_at": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"register_company":
{ Args: { "p_address": string,"p_city": string,"p_first_name": string,"p_last_name": string,"p_legal_name": string,"p_phone": string,"p_postal_code": string,"p_siret": string }; Returns: string
                           },
"set_company_status":
{ Args: { "p_company": string,"p_status": Database["public"]['Enums']["company_status"] }; Returns: undefined
                           },
"set_order_status":
{ Args: { "p_order": string,"p_status": Database["public"]['Enums']["order_status"] }; Returns: {
              "company_id": string,
"created_at": string,
"created_by": string | null,
"id": string,
"message": string | null,
"number": string,
"status": Database["public"]['Enums']["order_status"],
"store_id": string,
"total_ht": number,
"units": number,
"updated_at": string,
"viewed_at": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"show_limit":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"show_trgm":
{ Args: { "": string }; Returns: (string)[]
                           },
"unaccent":
{ Args: { "": string }; Returns: string
                           },
"unaccent_immutable":
{ Args: { "": string }; Returns: string
                           }
          }
          Enums: {
            "banner_audience": "new"|"all","banner_target": "product"|"category"|"brand"|"selection","banner_theme": "encre"|"pierre"|"blanc","company_status": "pending"|"active"|"refused"|"suspended"|"deleted","order_status": "received"|"preparing"|"done"|"cancelled","placeholder_shape": "tall"|"round"|"tube","user_role": "client"|"admin"
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
            "banner_audience": ["new", "all"],"banner_target": ["product", "category", "brand", "selection"],"banner_theme": ["encre", "pierre", "blanc"],"company_status": ["pending", "active", "refused", "suspended", "deleted"],"order_status": ["received", "preparing", "done", "cancelled"],"placeholder_shape": ["tall", "round", "tube"],"user_role": ["client", "admin"]
          }
        }
} as const
