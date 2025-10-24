import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * PDF Export Service for Seller Analytics
 * Generates comprehensive PDF reports with charts, tables, and analytics data
 */

export class PDFExportService {
  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
    this.lineHeight = 7;
  }

  /**
   * Export seller analytics to PDF
   * @param {Object} analyticsData - The analytics data from the API
   * @param {Object} user - User information
   * @param {string} timeframe - Selected timeframe
   * @param {string} elementId - ID of the element to capture (optional)
   */
  async exportAnalytics(analyticsData, user, timeframe, elementId = null) {
    try {
      // Reset document
      this.doc = new jsPDF('p', 'mm', 'a4');
      this.currentY = this.margin;

      // Add header
      this.addHeader(user, timeframe);

      // Add overview section
      this.addOverviewSection(analyticsData.overview);

      // Add charts section (if elementId provided, capture the charts)
      if (elementId) {
        await this.addChartsSection(elementId);
      }

      // Add detailed analytics sections
      this.addSalesDataSection(analyticsData.salesData);
      this.addTopProductsSection(analyticsData.topProducts);
      this.addCategoryPerformanceSection(analyticsData.categoryPerformance);
      this.addCustomerInsightsSection(analyticsData.customerInsights);
      this.addInventoryMetricsSection(analyticsData.inventoryMetrics);

      // Add footer
      this.addFooter();

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `seller-analytics-${user.name || user.email}-${timeframe}-${timestamp}.pdf`;

      // Save the PDF
      this.doc.save(filename);

      return { success: true, filename };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  /**
   * Add header section
   */
  addHeader(user, timeframe) {
    // Title
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Seller Analytics Report', this.margin, this.currentY);
    this.currentY += 10;

    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Generated for: ${user.name || user.email}`, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(`Timeframe: ${this.formatTimeframe(timeframe)}`, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(`Generated on: ${new Date().toLocaleDateString()}`, this.margin, this.currentY);
    this.currentY += 15;

    // Add a line separator
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  /**
   * Add overview metrics section
   */
  addOverviewSection(overview) {
    this.addSectionTitle('Overview Metrics');
    
    const metrics = [
      { label: 'Total Revenue', value: `₱${overview.totalRevenue?.toLocaleString() || '0'}` },
      { label: 'Total Orders', value: overview.totalOrders?.toString() || '0' },
      { label: 'Total Products', value: overview.totalProducts?.toString() || '0' },
      { label: 'Average Rating', value: `${overview.averageRating?.toFixed(1) || '0.0'} ⭐` },
      { label: 'Monthly Growth', value: `${overview.monthlyGrowth?.toFixed(1) || '0.0'}%` },
      { label: 'Conversion Rate', value: `${overview.conversionRate?.toFixed(1) || '0.0'}%` }
    ];

    this.addMetricsTable(metrics);
  }

  /**
   * Add sales data section
   */
  addSalesDataSection(salesData) {
    this.addSectionTitle('Sales Performance');
    
    if (salesData.daily && salesData.daily.length > 0) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Daily Sales Trend (Last 7 Days):', this.margin, this.currentY);
      this.currentY += 5;

      salesData.daily.slice(-7).forEach(day => {
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`${day.date}: ₱${day.revenue?.toLocaleString() || '0'}`, this.margin + 10, this.currentY);
        this.currentY += 4;
      });
      this.currentY += 5;
    }

    if (salesData.monthly && salesData.monthly.length > 0) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Monthly Sales Summary:', this.margin, this.currentY);
      this.currentY += 5;

      salesData.monthly.forEach(month => {
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`${month.month}: ₱${month.revenue?.toLocaleString() || '0'} (${month.orders || 0} orders)`, this.margin + 10, this.currentY);
        this.currentY += 4;
      });
      this.currentY += 10;
    }
  }

  /**
   * Add top products section
   */
  addTopProductsSection(topProducts) {
    if (!topProducts || topProducts.length === 0) return;

    this.addSectionTitle('Top Performing Products');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    
    // Table headers
    const headers = ['Product Name', 'Revenue', 'Orders', 'Rating'];
    const colWidths = [80, 30, 25, 25];
    let x = this.margin;
    
    headers.forEach((header, index) => {
      this.doc.text(header, x, this.currentY);
      x += colWidths[index];
    });
    this.currentY += 5;

    // Table rows
    topProducts.slice(0, 10).forEach(product => {
      this.doc.setFont('helvetica', 'normal');
      x = this.margin;
      
      // Product name (truncated)
      const name = product.name?.length > 30 ? product.name.substring(0, 30) + '...' : product.name || 'N/A';
      this.doc.text(name, x, this.currentY);
      x += colWidths[0];
      
      // Revenue
      this.doc.text(`₱${product.revenue?.toLocaleString() || '0'}`, x, this.currentY);
      x += colWidths[1];
      
      // Orders
      this.doc.text(product.orders?.toString() || '0', x, this.currentY);
      x += colWidths[2];
      
      // Rating
      this.doc.text(`${product.rating?.toFixed(1) || '0.0'}`, x, this.currentY);
      
      this.currentY += 4;
    });
    
    this.currentY += 10;
  }

  /**
   * Add category performance section
   */
  addCategoryPerformanceSection(categoryPerformance) {
    if (!categoryPerformance || categoryPerformance.length === 0) return;

    this.addSectionTitle('Category Performance');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    
    // Table headers
    const headers = ['Category', 'Revenue', 'Orders', 'Growth'];
    const colWidths = [60, 35, 25, 30];
    let x = this.margin;
    
    headers.forEach((header, index) => {
      this.doc.text(header, x, this.currentY);
      x += colWidths[index];
    });
    this.currentY += 5;

    // Table rows
    categoryPerformance.forEach(category => {
      this.doc.setFont('helvetica', 'normal');
      x = this.margin;
      
      this.doc.text(category.category || 'N/A', x, this.currentY);
      x += colWidths[0];
      
      this.doc.text(`₱${category.revenue?.toLocaleString() || '0'}`, x, this.currentY);
      x += colWidths[1];
      
      this.doc.text(category.orders?.toString() || '0', x, this.currentY);
      x += colWidths[2];
      
      this.doc.text(`${category.growth?.toFixed(1) || '0.0'}%`, x, this.currentY);
      
      this.currentY += 4;
    });
    
    this.currentY += 10;
  }

  /**
   * Add customer insights section
   */
  addCustomerInsightsSection(customerInsights) {
    this.addSectionTitle('Customer Insights');
    
    const insights = [
      { label: 'Total Customers', value: customerInsights.totalCustomers?.toString() || '0' },
      { label: 'Repeat Customers', value: customerInsights.repeatCustomers?.toString() || '0' },
      { label: 'Average Order Value', value: `₱${customerInsights.averageOrderValue?.toLocaleString() || '0'}` },
      { label: 'Customer Satisfaction', value: `${customerInsights.customerSatisfaction?.toFixed(1) || '0.0'}%` }
    ];

    this.addMetricsTable(insights);
  }

  /**
   * Add inventory metrics section
   */
  addInventoryMetricsSection(inventoryMetrics) {
    this.addSectionTitle('Inventory Metrics');
    
    const metrics = [
      { label: 'Low Stock Items', value: inventoryMetrics.lowStockItems?.toString() || '0' },
      { label: 'Out of Stock Items', value: inventoryMetrics.outOfStockItems?.toString() || '0' },
      { label: 'Total Inventory Value', value: `₱${inventoryMetrics.totalInventoryValue?.toLocaleString() || '0'}` },
      { label: 'Inventory Turnover', value: `${inventoryMetrics.inventoryTurnover?.toFixed(1) || '0.0'}x` }
    ];

    this.addMetricsTable(metrics);
  }

  /**
   * Add charts section by capturing HTML element
   */
  async addChartsSection(elementId) {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`Element with id ${elementId} not found`);
        return;
      }

      // Check if we need a new page
      if (this.currentY > this.pageHeight - 100) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      this.addSectionTitle('Analytics Charts');
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = this.pageWidth - (2 * this.margin);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Check if image fits on current page
      if (this.currentY + imgHeight > this.pageHeight - this.margin) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      this.doc.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, imgHeight);
      this.currentY += imgHeight + 10;
    } catch (error) {
      console.error('Error capturing charts:', error);
      // Continue without charts if capture fails
    }
  }

  /**
   * Add section title
   */
  addSectionTitle(title) {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 50) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;
  }

  /**
   * Add metrics table
   */
  addMetricsTable(metrics) {
    // Check if we need a new page
    if (this.currentY + (metrics.length * 6) > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.doc.setFontSize(10);
    
    metrics.forEach(metric => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${metric.label}:`, this.margin, this.currentY);
      
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(metric.value, this.margin + 60, this.currentY);
      
      this.currentY += 6;
    });
    
    this.currentY += 5;
  }

  /**
   * Add footer
   */
  addFooter() {
    const pageCount = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer text
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `Generated by Green Marketplace Analytics - Page ${i} of ${pageCount}`,
        this.margin,
        this.pageHeight - 10
      );
      
      // Footer line
      this.doc.setLineWidth(0.2);
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
    }
  }

  /**
   * Format timeframe for display
   */
  formatTimeframe(timeframe) {
    const formats = {
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days',
      '1y': 'Last year'
    };
    return formats[timeframe] || timeframe;
  }
}

// Export singleton instance
export const pdfExportService = new PDFExportService();
