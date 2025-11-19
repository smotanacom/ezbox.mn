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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          picture_url?: string | null
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
          picture_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          category_id?: number | null
          name: string
          description?: string | null
          base_price?: number
          picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          category_id?: number | null
          name?: string
          description?: string | null
          base_price?: number
          picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      parameter_groups: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
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
          created_at: string
        }
        Insert: {
          id?: number
          parameter_group_id: number
          name: string
          description?: string | null
          price_modifier?: number
          picture_url?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          parameter_group_id?: number
          name?: string
          description?: string | null
          price_modifier?: number
          picture_url?: string | null
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
          address: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          phone: string
          password_hash: string
          address?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          phone?: string
          password_hash?: string
          address?: string | null
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
          address: string
          phone: string
          total_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          cart_id?: number | null
          user_id?: number | null
          status?: string
          address: string
          phone: string
          total_price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          cart_id?: number | null
          user_id?: number | null
          status?: string
          address?: string
          phone?: string
          total_price?: number
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

// Extended types for frontend use
export interface ProductWithDetails extends Product {
  category?: Category
  parameter_groups?: (ProductParameterGroup & {
    parameter_group?: ParameterGroup
    default_parameter?: Parameter
    parameters?: Parameter[]
  })[]
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
  [parameterGroupId: number]: number // parameter_group_id -> parameter_id
}
