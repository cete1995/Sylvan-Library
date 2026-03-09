import axios from 'axios';
import { API_BASE_URL } from './client';
import { Card } from '../types';

const API_URL = API_BASE_URL;

export interface FeaturedBanner {
  _id?: string;
  imageUrl: string;
  title: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeaturedProduct {
  _id?: string;
  cardId: Card;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Public endpoints
export const getFeaturedBanner = async (): Promise<FeaturedBanner | null> => {
  try {
    const response = await axios.get(`${API_URL}/featured/banner`);
    return response.data.banner;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const getFeaturedProducts = async (): Promise<FeaturedProduct[]> => {
  try {
    const response = await axios.get(`${API_URL}/featured/products`);
    return response.data.products;
  } catch (error) {
    return [];
  }
};

// Admin endpoints
export const getAdminFeaturedBanner = async (token: string): Promise<FeaturedBanner | null> => {
  try {
    const response = await axios.get(`${API_URL}/admin/featured/banner`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.banner;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const upsertFeaturedBanner = async (
  token: string,
  bannerData: Omit<FeaturedBanner, '_id' | 'createdAt' | 'updatedAt'>
): Promise<FeaturedBanner> => {
  try {
    const response = await axios.post(`${API_URL}/admin/featured/banner`, bannerData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.banner;
  } catch (error: any) {
    throw error;
  }
};

export const getAdminFeaturedProducts = async (token: string): Promise<FeaturedProduct[]> => {
  const response = await axios.get(`${API_URL}/admin/featured/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.products;
};

export const addFeaturedProduct = async (
  token: string,
  productData: { cardId: string; order: number; isActive: boolean }
): Promise<FeaturedProduct> => {
  const response = await axios.post(`${API_URL}/admin/featured/products`, productData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.product;
};

export const updateFeaturedProduct = async (
  token: string,
  productId: string,
  productData: { cardId?: string; order?: number; isActive?: boolean }
): Promise<FeaturedProduct> => {
  const response = await axios.put(
    `${API_URL}/admin/featured/products/${productId}`,
    productData,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data.product;
};

export const deleteFeaturedProduct = async (
  token: string,
  productId: string
): Promise<void> => {
  await axios.delete(`${API_URL}/admin/featured/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
