export interface Product {
  id: string;
  name: string;
  slug: string;
  category: 'rings' | 'necklaces' | 'earrings' | 'bracelets';
  categoryLabel: string;
  price: number;
  description: string;
  materials: string[];
  dimensions: string;
  caratWeight: number;
  images: string[];
  modelUrl?: string;
  mtlUrl?: string;
  tryOnImageUrl?: string;
  isNew?: boolean;
  isLimited?: boolean;
  collection: string;
  specifications: Record<string, string>;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  vipTier: 'Amethyst Member' | 'Golden Circle' | 'Imperial Crown VIP';
  points: number;
  memberSince: string;
  avatarUrl?: string;
}

export interface TryOnRequest {
  imageFile?: string; // Base64
  productId: string;
}

export interface TryOnResponse {
  success: boolean;
  assessment: string;
  renderedImageUrl: string;
  faceShape: string;
  recommendedMetals: string[];
  stylistQuote: string;
}

export interface AvatarGenerationResponse {
  success: boolean;
  avatarUrl: string;
  description: string;
  recommendedCollections: string[];
  signatureStyle: string;
}
