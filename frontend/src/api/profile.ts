import api from './client';

export interface UserProfile {
  _id: string;
  email: string;
  name?: string;
  role: 'admin' | 'customer';
  address?: string;
  phoneNumber?: string;
  courierNotes?: string;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<{ user: UserProfile }>('/profile');
    return response.data.user;
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await api.put<{ user: UserProfile; message: string }>('/profile', data);
    return response.data.user;
  },
};
