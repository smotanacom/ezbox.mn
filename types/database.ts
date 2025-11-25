export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      schema_migrations: {
        Row: {
          id: number
          version: string
          applied_at: string
        }
        Insert: {
          id?: number
          version: string
          applied_at?: string
        }
        Update: {
          id?: number
          version?: string
          applied_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          description: string | null
          picture_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          picture_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          picture_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: number
          category_id: number | null
          name: string
          description: string | null
          base_price: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          category_id?: number | null
          name: string
          description?: string | null
          base_price?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          category_id?: number | null
          name?: string
          description?: string | null
          base_price?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      parameter_groups: {
        Row: {
          id: number
          name: string
          internal_name: string | null
          description: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          internal_name?: string | null
          description?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          internal_name?: string | null
          description?: string | null
          status?: string
          created_at?: string
        }
      }
      parameters: {
        Row: {
          id: number
          parameter_group_id: number
          name: string
          description: string | null
          price_modifier: number
          picture_url: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          parameter_group_id: number
          name: string
          description?: string | null
          price_modifier?: number
          picture_url?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          parameter_group_id?: number
          name?: string
          description?: string | null
          price_modifier?: number
          picture_url?: string | null
          status?: string
          created_at?: string
        }
      }
      product_parameter_groups: {
        Row: {
          id: number
          product_id: number
          parameter_group_id: number
          default_parameter_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          product_id: number
          parameter_group_id: number
          default_parameter_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          parameter_group_id?: number
          default_parameter_id?: number | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: number
          phone: string
          password_hash: string
          name: string | null
          address: string | null
          secondary_phone: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          phone: string
          password_hash: string
          name?: string | null
          address?: string | null
          secondary_phone?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          phone?: string
          password_hash?: string
          name?: string | null
          address?: string | null
          secondary_phone?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      carts: {
        Row: {
          id: number
          user_id: number | null
          session_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id?: number | null
          session_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: number | null
          session_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      product_in_cart: {
        Row: {
          id: number
          cart_id: number
          product_id: number
          quantity: number
          selected_parameters: Json | null
          special_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          cart_id: number
          product_id: number
          quantity?: number
          selected_parameters?: Json | null
          special_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          cart_id?: number
          product_id?: number
          quantity?: number
          selected_parameters?: Json | null
          special_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          cart_id: number | null
          user_id: number | null
          status: string
          name: string
          address: string
          phone: string
          secondary_phone: string | null
          total_price: number
          snapshot_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          cart_id?: number | null
          user_id?: number | null
          status?: string
          name: string
          address: string
          phone: string
          secondary_phone?: string | null
          total_price: number
          snapshot_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          cart_id?: number | null
          user_id?: number | null
          status?: string
          name?: string
          address?: string
          phone?: string
          secondary_phone?: string | null
          total_price?: number
          snapshot_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      specials: {
        Row: {
          id: number
          name: string
          description: string | null
          discounted_price: number
          status: string
          picture_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          discounted_price: number
          status?: string
          picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          discounted_price?: number
          status?: string
          picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      special_items: {
        Row: {
          id: number
          special_id: number
          product_id: number
          quantity: number
          selected_parameters: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          special_id: number
          product_id: number
          quantity?: number
          selected_parameters?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          special_id?: number
          product_id?: number
          quantity?: number
          selected_parameters?: Json | null
          created_at?: string
        }
      }
      admins: {
        Row: {
          id: number
          username: string
          password_hash: string
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          username: string
          password_hash: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          username?: string
          password_hash?: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: number
          storage_path: string
          thumbnail_path: string
          medium_path: string
          display_order: number
          alt_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: number
          storage_path: string
          thumbnail_path: string
          medium_path: string
          display_order?: number
          alt_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: number
          storage_path?: string
          thumbnail_path?: string
          medium_path?: string
          display_order?: number
          alt_text?: string | null
          created_at?: string
        }
      }
      product_models: {
        Row: {
          id: string
          product_id: number
          storage_path: string
          file_size: number
          file_format: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: number
          storage_path: string
          file_size: number
          file_format: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: number
          storage_path?: string
          file_size?: number
          file_format?: string
          created_at?: string
        }
      }
      history: {
        Row: {
          id: number
          entity_type: string
          entity_id: number
          action: string
          field_name: string | null
          old_value: string | null
          new_value: string | null
          changed_by_user_id: number | null
          changed_by_admin_id: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: number
          entity_type: string
          entity_id: number
          action: string
          field_name?: string | null
          old_value?: string | null
          new_value?: string | null
          changed_by_user_id?: number | null
          changed_by_admin_id?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          entity_type?: string
          entity_id?: number
          action?: string
          field_name?: string | null
          old_value?: string | null
          new_value?: string | null
          changed_by_user_id?: number | null
          changed_by_admin_id?: number | null
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Helper types
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ParameterGroup = Database['public']['Tables']['parameter_groups']['Row']
export type Parameter = Database['public']['Tables']['parameters']['Row']
export type ProductParameterGroup = Database['public']['Tables']['product_parameter_groups']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Cart = Database['public']['Tables']['carts']['Row']
export type ProductInCart = Database['public']['Tables']['product_in_cart']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Special = Database['public']['Tables']['specials']['Row']
export type SpecialItem = Database['public']['Tables']['special_items']['Row']
export type Admin = Database['public']['Tables']['admins']['Row']
export type ProductImage = Database['public']['Tables']['product_images']['Row']
export type ProductModel = Database['public']['Tables']['product_models']['Row']
export type History = Database['public']['Tables']['history']['Row']

// Extended types for frontend use
export interface ProductWithDetails extends Product {
  category?: Category
  parameter_groups?: (ProductParameterGroup & {
    parameter_group?: ParameterGroup
    default_parameter?: Parameter
    parameters?: Parameter[]
  })[]
  images?: ProductImage[]
  model?: ProductModel | null
}

export interface CartItemWithDetails extends ProductInCart {
  product?: ProductWithDetails
}

export interface SpecialWithItems extends Special {
  items?: (SpecialItem & {
    product?: Product
  })[]
}

export interface ParameterSelection {
  [parameterGroupId: string]: number // parameter_group_id -> parameter_id (keys are strings in JS)
}

export interface HistoryWithUser extends History {
  changed_by?: Pick<User, 'id' | 'phone' | 'is_admin'>
  changed_by_admin?: Pick<Admin, 'id' | 'username'>
}

// Order snapshot types
export interface OrderItemParameter {
  group: string       // Parameter group name (e.g., "Color", "Width")
  name: string        // Parameter name (e.g., "White", "60cm")
  value?: string      // Optional value (e.g., hex color "#FFFFFF")
}

export interface OrderItem {
  id: string                          // Unique ID for this line item (UUID)
  product_id: number                  // Reference to product (for admin linking, no FK constraint)
  product_name: string                // Product name at order time
  product_description: string | null  // Product description at order time
  category_name: string | null        // Category name at order time
  image_url: string | null            // Primary product image URL
  quantity: number                    // Quantity ordered
  unit_price: number                  // Final price per unit (admin editable)
  line_total: number                  // quantity * unit_price
  parameters: OrderItemParameter[]    // Selected parameters (human-readable)
  special_id?: number                 // If from special offer
  special_name?: string               // Special offer name
}

export interface OrderTotals {
  subtotal: number    // Sum of all line_totals
  discount: number    // Total discount amount
  tax: number         // Tax amount
  total: number       // Final total (should match orders.total_price column)
}

export interface OrderSnapshot {
  items: OrderItem[]
  totals: OrderTotals
  metadata?: {
    backfilled?: boolean  // True if migrated from existing data
    last_modified_by?: number  // Admin ID who last edited
    last_modified_at?: string  // ISO timestamp of last edit
  }
}

// Extended order type with parsed snapshot
export interface OrderWithSnapshot extends Order {
  snapshot_data: OrderSnapshot | null
}
