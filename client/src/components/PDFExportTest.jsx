import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FaFilePdf, FaSpinner } from 'react-icons/fa';
import { pdfExportService } from '@/services/pdfExportService';

/**
 * Test component for PDF export functionality
 * This can be used to test the PDF export service independently
 */
const PDFExportTest = () => {
  const [isExporting, setIsExporting] = useState(false);

  // Mock analytics data for testing
  const mockAnalyticsData = {
    overview: {
      totalRevenue: 125000,
      totalOrders: 45,
      totalProducts: 12,
      averageRating: 4.5,
      monthlyGrowth: 15.2,
      conversionRate: 8.7
    },
    salesData: {
      daily: [
        { date: '2024-01-01', revenue: 2500, orders: 3 },
        { date: '2024-01-02', revenue: 3200, orders: 4 },
        { date: '2024-01-03', revenue: 1800, orders: 2 },
        { date: '2024-01-04', revenue: 4500, orders: 6 },
        { date: '2024-01-05', revenue: 2800, orders: 3 },
        { date: '2024-01-06', revenue: 3600, orders: 5 },
        { date: '2024-01-07', revenue: 2200, orders: 2 }
      ],
      monthly: [
        { month: 'January', revenue: 25000, orders: 35 },
        { month: 'February', revenue: 32000, orders: 42 },
        { month: 'March', revenue: 28000, orders: 38 },
        { month: 'April', revenue: 40000, orders: 55 }
      ]
    },
    topProducts: [
      { name: 'Organic Green Tea', revenue: 15000, orders: 25, rating: 4.8 },
      { name: 'Eco-Friendly Water Bottle', revenue: 12000, orders: 20, rating: 4.6 },
      { name: 'Sustainable Bamboo Utensils', revenue: 8000, orders: 15, rating: 4.4 },
      { name: 'Recycled Paper Notebook', revenue: 6000, orders: 12, rating: 4.2 }
    ],
    categoryPerformance: [
      { category: 'Beverages', revenue: 25000, orders: 40, growth: 12.5 },
      { category: 'Kitchenware', revenue: 20000, orders: 35, growth: 8.3 },
      { category: 'Stationery', revenue: 15000, orders: 25, growth: 15.7 },
      { category: 'Personal Care', revenue: 10000, orders: 18, growth: 5.2 }
    ],
    customerInsights: {
      totalCustomers: 120,
      repeatCustomers: 45,
      averageOrderValue: 2800,
      customerSatisfaction: 92.5
    },
    inventoryMetrics: {
      lowStockItems: 3,
      outOfStockItems: 1,
      totalInventoryValue: 75000,
      inventoryTurnover: 2.4
    }
  };

  const mockUser = {
    name: 'John Doe',
    email: 'john.doe@example.com'
  };

  const handleTestExport = async () => {
    setIsExporting(true);
    try {
      await pdfExportService.exportAnalytics(
        mockAnalyticsData,
        mockUser,
        '30d',
        null // No charts container for this test
      );
      alert('Test PDF generated successfully!');
    } catch (error) {
      console.error('Test export error:', error);
      alert('Failed to generate test PDF: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FaFilePdf className="text-red-600" />
          PDF Export Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Test the PDF export functionality with mock analytics data.
        </p>
        <Button
          onClick={handleTestExport}
          disabled={isExporting}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
        >
          {isExporting ? (
            <>
              <FaSpinner className="animate-spin h-4 w-4 mr-2" />
              Generating Test PDF...
            </>
          ) : (
            <>
              <FaFilePdf className="h-4 w-4 mr-2" />
              Generate Test PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PDFExportTest;
