export interface MediaItem {
  url: string;
  public_id?: string;
  media_type: 'IMAGE' | 'VIDEO';
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  category: string;
  stock_status: 'IN_STOCK' | 'OUT_OF_STOCK';
  stock_quantity?: number;
  media?: MediaItem[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  stock_status?: 'IN_STOCK' | 'OUT_OF_STOCK';
  stock_quantity?: number;
  media?: MediaItem[];
}

export interface ProductFilters {
  search?: string;
  page: number;
  limit: number;
}