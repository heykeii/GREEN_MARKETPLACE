import { useState, useEffect } from 'react';
import { api } from '@/utils/apiClient';

export const useAdminCounts = () => {
  const [counts, setCounts] = useState({
    sellerVerification: 0,
    productVerification: 0,
    reports: 0,
    feedback: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      
      // Fetch all counts in parallel
      const [
        sellerResponse,
        productResponse,
        reportsResponse,
        feedbackResponse
      ] = await Promise.allSettled([
        api.get('/api/v1/admin/seller/applications?status=pending&limit=1'),
        api.get('/api/v1/admin/products/pending?limit=1'),
        api.get('/api/v1/reports/admin/all?status=pending&limit=1'),
        api.get('/api/v1/admin/feedback?status=pending&limit=1')
      ]);

      const newCounts = {
        sellerVerification: 0,
        productVerification: 0,
        reports: 0,
        feedback: 0
      };

      // Extract counts from responses
      if (sellerResponse.status === 'fulfilled' && sellerResponse.value?.pagination) {
        newCounts.sellerVerification = sellerResponse.value.pagination.totalItems || 0;
      }
      
      if (productResponse.status === 'fulfilled' && productResponse.value?.pagination) {
        newCounts.productVerification = productResponse.value.pagination.totalItems || 0;
      }
      
      if (reportsResponse.status === 'fulfilled' && reportsResponse.value?.pagination) {
        newCounts.reports = reportsResponse.value.pagination.totalItems || 0;
      }
      
      if (feedbackResponse.status === 'fulfilled' && feedbackResponse.value?.pagination) {
        newCounts.feedback = feedbackResponse.value.pagination.totalItems || 0;
      }

      setCounts(newCounts);
    } catch (error) {
      console.error('Error fetching admin counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { counts, loading, refetch: fetchCounts };
};
