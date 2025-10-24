import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Enhanced PDF Export Service for Seller Analytics
 * Generates comprehensive, professional PDF reports with charts, tables, and analytics data
 */

export class PDFExportService {
  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
    this.lineHeight = 7;
    this.sectionSpacing = 15;
  }

  /**
   * Export seller analytics to PDF with enhanced formatting and charts
   * @param {Object} analyticsData - The analytics data from the API
   * @param {Object} user - User information
   * @param {string} timeframe - Selected timeframe
   * @param {string} elementId - ID of the element to capture (optional)
   */
  async exportAnalytics(analyticsData, user, timeframe, elementId = null) {
    try {
      console.log('Starting PDF generation...');
      console.log('Analytics data:', analyticsData);
      console.log('User:', user);
      console.log('Timeframe:', timeframe);
      console.log('Element ID:', elementId);

      // Reset document
      this.doc = new jsPDF('p', 'mm', 'a4');
      this.currentY = this.margin;

      console.log('PDF document created');

      // Add professional header with logo area
      this.addEnhancedHeader(user, timeframe);
      console.log('Header added');

      // Add executive summary
      this.addExecutiveSummary(analyticsData.overview);
      console.log('Executive summary added');

      // Add charts section (if elementId provided, capture the charts)
      if (elementId) {
        console.log('Attempting to capture charts...');
        await this.addChartsSection(elementId);
        console.log('Charts captured');
      }

      // Add detailed analytics sections with improved formatting
      this.addDetailedOverviewSection(analyticsData.overview);
      console.log('Overview section added');

      this.addEnhancedSalesDataSection(analyticsData.salesData);
      console.log('Sales data section added');

      this.addTopProductsSection(analyticsData.topProducts);
      console.log('Top products section added');

      this.addCategoryPerformanceSection(analyticsData.categoryPerformance);
      console.log('Category performance section added');

      this.addCustomerInsightsSection(analyticsData.customerInsights);
      console.log('Customer insights section added');

      this.addInventoryMetricsSection(analyticsData.inventoryMetrics);
      console.log('Inventory metrics section added');

      // Add insights and recommendations
      this.addInsightsAndRecommendations(analyticsData);
      console.log('Insights section added');

      // Add professional footer
      this.addEnhancedFooter();
      console.log('Footer added');

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const sellerName = user.name ? user.name.replace(/\s+/g, '-') : user.email.split('@')[0];
      const filename = `Seller-Analytics-${sellerName}-${timeframe}-${timestamp}.pdf`;

      console.log('Saving PDF with filename:', filename);

      // Save the PDF
      this.doc.save(filename);

      console.log('PDF saved successfully');
      return { success: true, filename };
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Failed to generate PDF report: ${error.message}`);
    }
  }

  /**
   * Add enhanced header with professional styling
   */
  addEnhancedHeader(user, timeframe) {
    // Background color for header
    this.doc.setFillColor(34, 197, 94); // Green color
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');

    // Title
    this.doc.setTextColor(255, 255, 255); // White text
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SELLER ANALYTICS REPORT', this.margin, 20);

    // Reset text color
    this.doc.setTextColor(0, 0, 0);

    // Move to content area
    this.currentY = 50;

    // Seller information box
    this.doc.setFillColor(248, 250, 252); // Light gray background
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 25, 'F');
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Report Details', this.margin + 5, this.currentY + 8);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text(`Generated for: ${user.name || user.email}`, this.margin + 5, this.currentY + 15);
    this.doc.text(`Timeframe: ${this.formatTimeframe(timeframe)}`, this.margin + 5, this.currentY + 20);
    this.doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, this.margin + 5, this.currentY + 25);

    this.currentY += 35;
  }

  /**
   * Add executive summary section
   */
  addExecutiveSummary(overview) {
    this.addSectionTitle('📊 Executive Summary', true);
    
    // Create summary box
    this.doc.setFillColor(239, 246, 255); // Light blue background
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 30, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const summaryText = `Your business shows ${overview.monthlyGrowth > 0 ? 'positive' : 'negative'} growth of ${overview.monthlyGrowth?.toFixed(1) || '0.0'}% with a total revenue of ₱${overview.totalRevenue?.toLocaleString() || '0'}. ` +
                      `You have ${overview.totalOrders || '0'} orders across ${overview.totalProducts || '0'} products with an average rating of ${overview.averageRating?.toFixed(1) || '0.0'} stars. ` +
                      `Your conversion rate stands at ${overview.conversionRate?.toFixed(1) || '0.0'}%.`;
    
    const lines = this.doc.splitTextToSize(summaryText, this.pageWidth - (2 * this.margin) - 10);
    this.doc.text(lines, this.margin + 5, this.currentY + 8);
    
    this.currentY += 40;
  }

  /**
   * Add detailed overview metrics with better formatting
   */
  addDetailedOverviewSection(overview) {
    this.addSectionTitle('📈 Key Performance Indicators');
    
    // Create metrics grid
    const metrics = [
      { label: 'Total Revenue', value: `₱${overview.totalRevenue?.toLocaleString() || '0'}`, color: [34, 197, 94] },
      { label: 'Total Orders', value: overview.totalOrders?.toString() || '0', color: [59, 130, 246] },
      { label: 'Total Products', value: overview.totalProducts?.toString() || '0', color: [168, 85, 247] },
      { label: 'Average Rating', value: `${overview.averageRating?.toFixed(1) || '0.0'} ⭐`, color: [245, 158, 11] },
      { label: 'Monthly Growth', value: `${overview.monthlyGrowth?.toFixed(1) || '0.0'}%`, color: overview.monthlyGrowth >= 0 ? [34, 197, 94] : [239, 68, 68] },
      { label: 'Conversion Rate', value: `${overview.conversionRate?.toFixed(1) || '0.0'}%`, color: [236, 72, 153] }
    ];

    this.addMetricsGrid(metrics);
  }

  /**
   * Add enhanced sales data section
   */
  addEnhancedSalesDataSection(salesData) {
    this.addSectionTitle('💰 Sales Performance Analysis');
    
    if (salesData.daily && salesData.daily.length > 0) {
      // Daily sales trend
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Daily Sales Trend (Last 7 Days)', this.margin, this.currentY);
      this.currentY += 8;

      // Create table for daily sales
      const dailyData = salesData.daily.slice(-7);
      this.addSalesTable(dailyData, 'daily');
    }

    if (salesData.monthly && salesData.monthly.length > 0) {
      // Monthly sales summary
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Monthly Sales Summary', this.margin, this.currentY);
      this.currentY += 8;

      // Create table for monthly sales
      this.addSalesTable(salesData.monthly, 'monthly');
    }
  }

  /**
   * Add enhanced top products section
   */
  addTopProductsSection(topProducts) {
    if (!topProducts || topProducts.length === 0) return;

    this.addSectionTitle('🏆 Top Performing Products');
    
    // Create professional table
    this.addProductsTable(topProducts.slice(0, 10));
  }

  /**
   * Add enhanced category performance section
   */
  addCategoryPerformanceSection(categoryPerformance) {
    if (!categoryPerformance || categoryPerformance.length === 0) return;

    this.addSectionTitle('📂 Category Performance Analysis');
    
    // Create category table
    this.addCategoryTable(categoryPerformance);
  }

  /**
   * Add enhanced customer insights section
   */
  addCustomerInsightsSection(customerInsights) {
    this.addSectionTitle('👥 Customer Insights');
    
    const insights = [
      { label: 'Total Customers', value: customerInsights.totalCustomers?.toString() || '0', color: [59, 130, 246] },
      { label: 'Repeat Customers', value: customerInsights.repeatCustomers?.toString() || '0', color: [34, 197, 94] },
      { label: 'Average Order Value', value: `₱${customerInsights.averageOrderValue?.toLocaleString() || '0'}`, color: [168, 85, 247] },
      { label: 'Customer Satisfaction', value: `${customerInsights.customerSatisfaction?.toFixed(1) || '0.0'}%`, color: [245, 158, 11] }
    ];

    this.addMetricsGrid(insights);
  }

  /**
   * Add enhanced inventory metrics section
   */
  addInventoryMetricsSection(inventoryMetrics) {
    this.addSectionTitle('📦 Inventory Management');
    
    const metrics = [
      { label: 'Low Stock Items', value: inventoryMetrics.lowStockItems?.toString() || '0', color: [245, 158, 11] },
      { label: 'Out of Stock Items', value: inventoryMetrics.outOfStockItems?.toString() || '0', color: [239, 68, 68] },
      { label: 'Total Inventory Value', value: `₱${inventoryMetrics.totalInventoryValue?.toLocaleString() || '0'}`, color: [34, 197, 94] },
      { label: 'Inventory Turnover', value: `${inventoryMetrics.inventoryTurnover?.toFixed(1) || '0.0'}x`, color: [59, 130, 246] }
    ];

    this.addMetricsGrid(metrics);
  }

  /**
   * Add insights and recommendations
   */
  addInsightsAndRecommendations(analyticsData) {
    this.addSectionTitle('💡 Insights & Recommendations');
    
    // Create insights box
    this.doc.setFillColor(254, 249, 195); // Light yellow background
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 40, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const insights = [];
    
    // Growth insights
    if (analyticsData.overview?.monthlyGrowth > 20) {
      insights.push("🎉 Excellent growth! Consider expanding your product line.");
    } else if (analyticsData.overview?.monthlyGrowth < 0) {
      insights.push("⚠️ Negative growth detected. Review your marketing strategy.");
    }
    
    // Inventory insights
    if (analyticsData.inventoryMetrics?.lowStockItems > 3) {
      insights.push("📦 Consider restocking low inventory items to avoid stockouts.");
    }
    
    // Rating insights
    if (analyticsData.overview?.averageRating < 4.0) {
      insights.push("⭐ Focus on improving product quality and customer service.");
    }
    
    // Default insights
    if (insights.length === 0) {
      insights.push("📈 Continue monitoring your analytics for growth opportunities.");
      insights.push("🔄 Regular analysis helps identify trends and optimization areas.");
    }
    
    const insightsText = insights.join('\n\n');
    const lines = this.doc.splitTextToSize(insightsText, this.pageWidth - (2 * this.margin) - 10);
    this.doc.text(lines, this.margin + 5, this.currentY + 8);
    
    this.currentY += 50;
  }

  /**
   * Add charts section by capturing HTML element
   */
  async addChartsSection(elementId) {
    try {
      console.log('Starting chart capture for element:', elementId);
      
      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`Element with id ${elementId} not found`);
        return;
      }

      console.log('Element found, dimensions:', {
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight
      });

      // Check if we need a new page
      if (this.currentY > this.pageHeight - 100) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      this.addSectionTitle('📊 Visual Analytics Charts');
      
      // Wait a bit for charts to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Capturing charts with html2canvas...');
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth || element.offsetWidth,
        height: element.scrollHeight || element.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth || element.offsetWidth,
        windowHeight: element.scrollHeight || element.offsetHeight
      });

      console.log('Canvas created, dimensions:', {
        width: canvas.width,
        height: canvas.height
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = this.pageWidth - (2 * this.margin);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      console.log('Image dimensions for PDF:', {
        imgWidth,
        imgHeight,
        currentY: this.currentY,
        pageHeight: this.pageHeight,
        margin: this.margin
      });

      // Check if image fits on current page
      if (this.currentY + imgHeight > this.pageHeight - this.margin) {
        console.log('Image too large for current page, adding new page');
        this.doc.addPage();
        this.currentY = this.margin;
      }

      console.log('Adding image to PDF...');
      this.doc.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, imgHeight);
      this.currentY += imgHeight + 15;
      
      console.log('Charts successfully added to PDF');
    } catch (error) {
      console.error('Error capturing charts:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      // Add a placeholder text if chart capture fails
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('📊 Charts Section', this.margin, this.currentY);
      this.currentY += 10;
      
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Charts could not be captured. Please check the analytics dashboard for visual data.', this.margin, this.currentY);
      this.currentY += 15;
    }
  }

  /**
   * Add section title with enhanced styling
   */
  addSectionTitle(title, isMain = false) {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 50) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    if (isMain) {
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
    } else {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
    }
    
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += isMain ? 12 : 10;

    // Add underline
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY - 2, this.pageWidth - this.margin, this.currentY - 2);
    this.currentY += 5;
  }

  /**
   * Add metrics grid with colored backgrounds
   */
  addMetricsGrid(metrics) {
    const itemsPerRow = 2;
    const itemWidth = (this.pageWidth - (2 * this.margin) - 10) / itemsPerRow;
    const itemHeight = 20;

    for (let i = 0; i < metrics.length; i += itemsPerRow) {
      // Check if we need a new page
      if (this.currentY + itemHeight > this.pageHeight - this.margin) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      for (let j = 0; j < itemsPerRow && (i + j) < metrics.length; j++) {
        const metric = metrics[i + j];
        const x = this.margin + (j * (itemWidth + 10));
        
        // Background color
        this.doc.setFillColor(metric.color[0], metric.color[1], metric.color[2], 0.1);
        this.doc.rect(x, this.currentY, itemWidth, itemHeight, 'F');
        
        // Border
        this.doc.setDrawColor(metric.color[0], metric.color[1], metric.color[2]);
        this.doc.setLineWidth(0.5);
        this.doc.rect(x, this.currentY, itemWidth, itemHeight);
        
        // Text
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
        this.doc.text(metric.label, x + 5, this.currentY + 8);
        
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(metric.value, x + 5, this.currentY + 15);
      }
      
      this.currentY += itemHeight + 10;
    }
    
    this.currentY += 5;
  }

  /**
   * Add sales table
   */
  addSalesTable(data, type) {
    const headers = type === 'daily' ? ['Date', 'Revenue', 'Orders'] : ['Month', 'Revenue', 'Orders'];
    const colWidths = type === 'daily' ? [40, 35, 25] : [35, 40, 25];
    
    this.addTable(headers, colWidths, data.map(item => [
      type === 'daily' ? item.date : item.month,
      `₱${item.revenue?.toLocaleString() || '0'}`,
      item.orders?.toString() || '0'
    ]));
  }

  /**
   * Add products table
   */
  addProductsTable(products) {
    const headers = ['Product Name', 'Revenue', 'Orders', 'Rating'];
    const colWidths = [70, 30, 25, 25];
    
    this.addTable(headers, colWidths, products.map(product => [
      product.name?.length > 25 ? product.name.substring(0, 25) + '...' : product.name || 'N/A',
      `₱${product.revenue?.toLocaleString() || '0'}`,
      product.orders?.toString() || '0',
      `${product.rating?.toFixed(1) || '0.0'}`
    ]));
  }

  /**
   * Add category table
   */
  addCategoryTable(categories) {
    const headers = ['Category', 'Revenue', 'Orders', 'Growth'];
    const colWidths = [50, 35, 25, 30];
    
    this.addTable(headers, colWidths, categories.map(category => [
      category.category || 'N/A',
      `₱${category.revenue?.toLocaleString() || '0'}`,
      category.orders?.toString() || '0',
      `${category.growth?.toFixed(1) || '0.0'}%`
    ]));
  }

  /**
   * Add professional table
   */
  addTable(headers, colWidths, data) {
    // Check if we need a new page
    if (this.currentY + (data.length + 1) * 8 > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Table headers
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFillColor(34, 197, 94, 0.1);
    
    let x = this.margin;
    headers.forEach((header, index) => {
      this.doc.rect(x, this.currentY, colWidths[index], 8, 'F');
      this.doc.text(header, x + 2, this.currentY + 5);
      x += colWidths[index];
    });
    this.currentY += 8;

    // Table rows
    this.doc.setFont('helvetica', 'normal');
    data.forEach(row => {
      x = this.margin;
      row.forEach((cell, index) => {
        this.doc.text(cell, x + 2, this.currentY + 5);
        x += colWidths[index];
      });
      this.currentY += 6;
    });
    
    this.currentY += 10;
  }

  /**
   * Add enhanced footer
   */
  addEnhancedFooter() {
    const pageCount = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer background
      this.doc.setFillColor(34, 197, 94, 0.1);
      this.doc.rect(0, this.pageHeight - 15, this.pageWidth, 15, 'F');
      
      // Footer text
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(
        `Generated by Green Marketplace Analytics - Page ${i} of ${pageCount}`,
        this.margin,
        this.pageHeight - 8
      );
      
      // Footer line
      this.doc.setLineWidth(0.2);
      this.doc.setDrawColor(34, 197, 94);
      this.doc.line(this.margin, this.pageHeight - 12, this.pageWidth - this.margin, this.pageHeight - 12);
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
