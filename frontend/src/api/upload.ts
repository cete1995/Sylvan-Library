import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const uploadImage = async (file: File, token: string): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await axios.post(`${API_URL}/upload/image`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });

  // Return the full URL to the uploaded image
  return `http://localhost:5000${response.data.imageUrl}`;
};
