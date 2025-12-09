import api from './client';

export interface CarouselImage {
  _id: string;
  imageUrl: string;
  altText?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const carouselApi = {
  getImages: async (): Promise<CarouselImage[]> => {
    const response = await api.get<{ images: CarouselImage[] }>('/carousel');
    return response.data.images;
  },

  getAdminImages: async (): Promise<CarouselImage[]> => {
    const response = await api.get<{ images: CarouselImage[] }>('/admin/carousel');
    return response.data.images;
  },

  uploadImage: async (data: { imageUrl: string; altText?: string; order: number }): Promise<{ image: CarouselImage; message: string }> => {
    const response = await api.post<{ image: CarouselImage; message: string }>('/admin/carousel', data);
    return response.data;
  },

  updateImage: async (id: string, data: Partial<{ imageUrl: string; altText: string; order: number; isActive: boolean }>): Promise<{ image: CarouselImage; message: string }> => {
    const response = await api.put<{ image: CarouselImage; message: string }>(`/admin/carousel/${id}`, data);
    return response.data;
  },

  deleteImage: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/admin/carousel/${id}`);
    return response.data;
  },
};
