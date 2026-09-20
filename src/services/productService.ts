import { Product } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_PRODUCTS } from '../lib/seedData';

const PRODUCTS_STORAGE_KEY = 'printlab_products_data_v1';

function getLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRODUCTS;
  }
}

function saveLocalProducts(products: Product[]): void {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
}

export const productService = {
  async getAll(): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) return data as Product[];
      } catch (err) {
        console.warn('Supabase products fetch failed, falling back to storage:', err);
      }
    }
    return getLocalProducts();
  },

  async getFeatured(): Promise<Product[]> {
    const all = await this.getAll();
    return all.filter((p) => p.is_featured && p.is_available);
  },

  async getBySlugOrId(idOrSlug: string): Promise<Product | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
          .maybeSingle();

        if (error) throw error;
        if (data) return data as Product;
      } catch (err) {
        console.warn('Supabase single product fetch failed:', err);
      }
    }
    const all = getLocalProducts();
    return all.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
  },

  async create(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const newProduct: Product = {
      ...productData,
      id: 'prod-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('products').insert([productData]).select().single();
        if (error) throw error;
        if (data) return data as Product;
      } catch (err) {
        console.warn('Supabase product insert failed, saving locally:', err);
      }
    }

    const current = getLocalProducts();
    const updated = [newProduct, ...current];
    saveLocalProducts(updated);
    return newProduct;
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        if (data) return data as Product;
      } catch (err) {
        console.warn('Supabase product update failed:', err);
      }
    }

    const current = getLocalProducts();
    const index = current.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const updatedProduct = {
      ...current[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    current[index] = updatedProduct;
    saveLocalProducts(current);
    return updatedProduct;
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase product delete failed:', err);
      }
    }

    const current = getLocalProducts();
    const updated = current.filter((p) => p.id !== id);
    saveLocalProducts(updated);
  },

  async resetToSampleData(): Promise<Product[]> {
    saveLocalProducts(INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  }
};

export function resetAllStorageToSeed(): void {
  localStorage.removeItem('printlab_products_data_v1');
  localStorage.removeItem('printlab_orders_data_v1');
  localStorage.removeItem('printlab_customers_data_v1');
}

