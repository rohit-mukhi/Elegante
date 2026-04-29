import { useState } from 'react';

interface BackendRecommendationInput {
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  underTone: string;
  bodyType?: string;
}

interface ColorRecommendation {
  name: string;
  hex: string;
}

interface BackendRecommendationResponse {
  success: boolean;
  colors: ColorRecommendation[];
  features: {
    hairColor: string;
    eyeColor: string;
    skinTone: string;
    underTone: string;
    bodyType: string;
  };
}
// Dummy comment
const BACKEND_URL = 'https://elegante-backend-srp-rm.vercel.app/api/recommendations.js';

export const useBackendRecommendation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = async (features: BackendRecommendationInput): Promise<ColorRecommendation[]> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 [FRONTEND] Sending features to backend:', features);
      console.log('🌐 [FRONTEND] Backend URL:', BACKEND_URL);

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(features),
      });

      console.log('📡 [FRONTEND] Response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }

      const data: BackendRecommendationResponse = await response.json();
      console.log('📦 [FRONTEND] Full response from backend:', data);

      if (!data.success || !data.colors) {
        throw new Error('Invalid response from backend');
      }

      console.log('✅ [FRONTEND] Received colors from Groq LLM via backend:', data.colors);
      console.log('🎨 [FRONTEND] Number of colors:', data.colors.length);

      return data.colors;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      console.error('❌ [FRONTEND] Backend recommendation error:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      console.log('🏁 [FRONTEND] Recommendation request completed');
    }
  };

  return {
    getRecommendations,
    loading,
    error,
  };
};
