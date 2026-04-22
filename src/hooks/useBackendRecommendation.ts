import { useState } from 'react';

interface BackendRecommendationInput {
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  underTone: string;
  bodyType?: string;
}

interface BackendRecommendationResponse {
  success: boolean;
  colors: string[];
  features: {
    hairColor: string;
    eyeColor: string;
    skinTone: string;
    underTone: string;
    bodyType: string;
  };
}

const BACKEND_URL = 'https://elegante-backend-srp-rm.vercel.app/api/recommendations.js';

export const useBackendRecommendation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = async (features: BackendRecommendationInput): Promise<string[]> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Sending features to backend:', features);

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(features),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }

      const data: BackendRecommendationResponse = await response.json();

      if (!data.success || !data.colors) {
        throw new Error('Invalid response from backend');
      }

      console.log('✅ Received colors from backend:', data.colors);

      return data.colors;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      console.error('❌ Backend recommendation error:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    getRecommendations,
    loading,
    error,
  };
};
