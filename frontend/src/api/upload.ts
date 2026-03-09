import api, { API_BASE_URL } from './client';

const BASE_URL = API_BASE_URL.replace('/api', '');

export const uploadImage = async (file: File, _token?: string): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  // Return the full URL to the uploaded image
  return `${BASE_URL}${response.data.imageUrl}`;
};
