import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';

import {
  Chart,
  registerables
} from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink,FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent
  implements OnInit, AfterViewInit, OnDestroy {

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('salesChart')
  salesChartRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('orderStatusChart')
  orderStatusChartRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('topSellingChart')
  topSellingChartRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('revenueOrdersChart')
revenueOrdersChartRef!: ElementRef<HTMLCanvasElement>;

  private salesChart?: Chart;
  private orderStatusChart?: Chart;
  private topSellingChart?: Chart;
  private revenueOrdersChart?: Chart;

  private chartReady = false;
  private dashboardDataLoaded = false;

  totalProducts = 0;
  totalOrders = 0;
  totalUsers = 0;
  totalRevenue = 0;
  averageOrderValue = 0;


  bestSellingMonth = 'N/A';
highestRevenuePeriod = 'N/A';
highestRevenueAmount = 0;
mostPopularProduct = 'N/A';
totalUnitsSold = 0;

  previousRevenue = 0;
revenueGrowth = 0;
isRevenueGrowthPositive = true;

  selectedDateRange = 'all';

dateRangeOptions = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' }
];

allOrders: any[] = [];

  recentOrders: any[] = [];
  lowStockProducts: any[] = [];

  hasTopSellingProducts = false;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
  this.chartReady = true;

  if (this.dashboardDataLoaded) {
    this.renderDashboardCharts();
  }
}

  ngOnDestroy(): void {
    this.salesChart?.destroy();
    this.orderStatusChart?.destroy();
    this.topSellingChart?.destroy();
    this.revenueOrdersChart?.destroy();
  }


  renderDashboardCharts(): void {
  if (!this.chartReady || !this.dashboardDataLoaded) {
    return;
  }

  this.createSalesChart(this.allOrders);
  this.createOrderStatusChart(this.allOrders);
  this.createTopSellingChart(this.allOrders);
  this.createRevenueOrdersChart(this.allOrders);
}

  loadDashboardData(): void {
    forkJoin({
      products: this.http.get<any[]>('http://localhost:3000/products'),
      orders: this.http.get<any[]>('http://localhost:3000/orders'),
      users: this.http.get<any[]>('http://localhost:3000/users')
    }).subscribe({
      next: (data) => {

        this.totalProducts = data.products.length;
        this.totalOrders = data.orders.length;
        this.allOrders = data.orders;

        this.totalUsers = data.users.filter(
          user => user.role === 'user'
        ).length;

        const validOrders = data.orders.filter(
          order => order.status?.toLowerCase() !== 'cancelled'
        );

        this.totalRevenue = validOrders.reduce(
          (total, order) => total + Number(order.total || 0),
          0
        );

        this.recentOrders = [...data.orders]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        this.lowStockProducts = data.products
          .filter(product => product.stock <= 5)
          .slice(0, 5);

        this.dashboardDataLoaded = true;
        this.calculateRevenueGrowth();
        this.calculateAverageOrderValue();
        this.calculateSalesInsights();

        if (this.chartReady) {
  this.renderDashboardCharts();
}
      },

      error: (error) => {
        console.error('Dashboard loading failed:', error);
      }
    });
  }


onDateRangeChange(): void {
  const now = new Date();

  let startDate: Date | null = null;

  switch (this.selectedDateRange) {

    case 'today':
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      break;

    case '7days':
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
      break;

    case '30days':
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
      break;

    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;

    case 'all':
      startDate = null;
      break;
  }

  const filteredOrders = this.allOrders.filter(order => {

    if (!startDate) {
      return true;
    }

    const orderDate = new Date(order.createdAt);

    return orderDate >= startDate && orderDate <= now;
  });

  // Exclude cancelled orders from revenue
  const validOrders = filteredOrders.filter(
    order => order.status?.toLowerCase() !== 'cancelled'
  );

  this.totalRevenue = validOrders.reduce(
    (total, order) => total + Number(order.total || 0),
    0
  );

  // Update all three charts
  this.createSalesChart(validOrders);
  this.createOrderStatusChart(filteredOrders);
  this.createTopSellingChart(filteredOrders);
  this.calculateRevenueGrowth();
  this.calculateAverageOrderValue();
  this.createRevenueOrdersChart(filteredOrders);
}


  // SALES ANALYTICS


  calculateRevenueGrowth(): void {

  const now = new Date();

  let currentStart: Date;
  let previousStart: Date;
  let previousEnd: Date;

  switch (this.selectedDateRange) {

    case 'today':
      currentStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 1);

      previousEnd = new Date(currentStart.getTime() - 1);
      break;

    case '7days':
    case '30days': {
      const days = this.selectedDateRange === '7days' ? 7 : 30;

      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - days);

      previousEnd = new Date(currentStart.getTime() - 1);

      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - days);
      break;
    }

    case 'year':
      currentStart = new Date(now.getFullYear(), 0, 1);

      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      previousEnd = new Date(currentStart.getTime() - 1);
      break;

    default:
      // Growth comparison is not meaningful for All Time.
      this.previousRevenue = 0;
      this.revenueGrowth = 0;
      this.isRevenueGrowthPositive = true;
      return;
  }

  const currentRevenue = this.allOrders
    .filter(order => {
      const date = new Date(order.createdAt);

      return order.status?.toLowerCase() !== 'cancelled' &&
             date >= currentStart &&
             date <= now;
    })
    .reduce(
      (total, order) => total + Number(order.total || 0),
      0
    );

  this.previousRevenue = this.allOrders
    .filter(order => {
      const date = new Date(order.createdAt);

      return order.status?.toLowerCase() !== 'cancelled' &&
             date >= previousStart &&
             date <= previousEnd;
    })
    .reduce(
      (total, order) => total + Number(order.total || 0),
      0
    );

  if (this.previousRevenue === 0) {
    this.revenueGrowth = currentRevenue > 0 ? 100 : 0;
  } else {
    this.revenueGrowth =
      ((currentRevenue - this.previousRevenue) /
        this.previousRevenue) * 100;
  }

  this.isRevenueGrowthPositive = this.revenueGrowth >= 0;
}




calculateAverageOrderValue(): void {

  const now = new Date();

  let startDate: Date | null = null;

  switch (this.selectedDateRange) {

    case 'today':
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      break;

    case '7days':
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
      break;

    case '30days':
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
      break;

    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
  }

  const validOrders = this.allOrders.filter(order => {

    if (order.status?.toLowerCase() === 'cancelled') {
      return false;
    }

    if (!startDate) {
      return true;
    }

    const orderDate = new Date(order.createdAt);

    return orderDate >= startDate && orderDate <= now;
  });

  const revenue = validOrders.reduce(
    (total, order) => total + Number(order.total || 0),
    0
  );

  this.averageOrderValue = validOrders.length > 0
    ? revenue / validOrders.length
    : 0;
}




// SALES PERFORMANCE INSIGHTS

calculateSalesInsights(): void {

  const validOrders = this.allOrders.filter(
    order => order.status?.toLowerCase() !== 'cancelled'
  );

  // TOTAL UNITS SOLD

  this.totalUnitsSold = validOrders.reduce(
    (total, order) => {
      const orderQuantity = order.items?.reduce(
        (sum: number, item: any) =>
          sum + Number(item.quantity || 0),
        0
      ) || 0;

      return total + orderQuantity;
    },
    0
  );

  // MOST POPULAR PRODUCT

  const productSales: { [key: string]: number } = {};

  validOrders.forEach(order => {

    order.items?.forEach((item: any) => {

      const productName = item.product?.name;

      if (!productName) return;

      productSales[productName] =
        (productSales[productName] || 0) +
        Number(item.quantity || 0);

    });

  });

  const popularProduct = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])[0];

  this.mostPopularProduct = popularProduct
    ? popularProduct[0]
    : 'N/A';

  // MONTH WITH MOST ORDERS

  const monthlyOrders: { [key: string]: number } = {};

  validOrders.forEach(order => {

    const date = new Date(order.createdAt);

    const month = date.toLocaleString('en-IN', {
      month: 'long',
      year: 'numeric'
    });

    monthlyOrders[month] =
      (monthlyOrders[month] || 0) + 1;

  });

  const bestMonth = Object.entries(monthlyOrders)
    .sort((a, b) => b[1] - a[1])[0];

  this.bestSellingMonth = bestMonth
    ? bestMonth[0]
    : 'N/A';

  // HIGHEST REVENUE MONTH

  const monthlyRevenue: { [key: string]: number } = {};

  validOrders.forEach(order => {

    const date = new Date(order.createdAt);

    const month = date.toLocaleString('en-IN', {
      month: 'long',
      year: 'numeric'
    });

    monthlyRevenue[month] =
      (monthlyRevenue[month] || 0) +
      Number(order.total || 0);

  });

  const highestRevenue = Object.entries(monthlyRevenue)
    .sort((a, b) => b[1] - a[1])[0];

  this.highestRevenuePeriod = highestRevenue
    ? highestRevenue[0]
    : 'N/A';

  this.highestRevenueAmount = highestRevenue
    ? highestRevenue[1]
    : 0;
}



createSalesChart(orders: any[] = []): void {

  if (!this.chartReady || !this.dashboardDataLoaded) return;

  this.salesChart?.destroy();

  const now = new Date();

  const months: string[] = [];
  const salesData: number[] = [];

  // TODAY
  if (this.selectedDateRange === 'today') {

    const todaySales = orders
      .filter(order => {
        const date = new Date(order.createdAt);

        return date.toDateString() === now.toDateString();
      })
      .reduce((total, order) => total + Number(order.total || 0), 0);

    months.push('Today');
    salesData.push(todaySales);
  }

  // LAST 7 DAYS
  else if (this.selectedDateRange === '7days') {

    for (let i = 6; i >= 0; i--) {

      const date = new Date();
      date.setDate(now.getDate() - i);

      const dailySales = orders
        .filter(order => {
          const orderDate = new Date(order.createdAt);

          return orderDate.toDateString() === date.toDateString();
        })
        .reduce((total, order) => total + Number(order.total || 0), 0);

      months.push(
        date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short'
        })
      );

      salesData.push(dailySales);
    }
  }

  // LAST 30 DAYS - WEEKLY
  else if (this.selectedDateRange === '30days') {

    for (let i = 3; i >= 0; i--) {

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      endDate.setDate(now.getDate() - (i * 7));

      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      // First week starts at the beginning of the 30-day period
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      if (startDate < thirtyDaysAgo) {
        startDate.setTime(thirtyDaysAgo.getTime());
      }

      const weeklySales = orders
        .filter(order => {
          const orderDate = new Date(order.createdAt);

          return orderDate >= startDate &&
                 orderDate <= endDate;
        })
        .reduce((total, order) => total + Number(order.total || 0), 0);

      months.push(`Week ${4 - i}`);
      salesData.push(weeklySales);
    }
  }

  
  // THIS YEAR / ALL TIME
else {

  const monthlySalesMap: {
    [key: string]: number
  } = {};

  orders.forEach(order => {

    const date = new Date(order.createdAt);

    const key = `${date.getFullYear()}-${date.getMonth()}`;

    monthlySalesMap[key] =
      (monthlySalesMap[key] || 0) +
      Number(order.total || 0);

  });

  let monthsToDisplay: string[] = [];
  let salesToDisplay: number[] = [];

  if (this.selectedDateRange === 'year') {

    for (let month = 0; month <= now.getMonth(); month++) {

      const key = `${now.getFullYear()}-${month}`;

      monthsToDisplay.push(
        new Date(now.getFullYear(), month, 1)
          .toLocaleString('en-IN', { month: 'short' })
      );

      salesToDisplay.push(monthlySalesMap[key] || 0);
    }

  } else {

    const sortedKeys = Object.keys(monthlySalesMap).sort(
      (a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);

        return yearA - yearB || monthA - monthB;
      }
    );

    sortedKeys.forEach(key => {

      const [year, month] = key.split('-').map(Number);

      monthsToDisplay.push(
        new Date(year, month, 1).toLocaleString('en-IN', {
          month: 'short',
          year: 'numeric'
        })
      );

      salesToDisplay.push(monthlySalesMap[key]);
    });

  }

  months.push(...monthsToDisplay);
  salesData.push(...salesToDisplay);
}

  this.salesChart = new Chart(this.salesChartRef.nativeElement, {

    type: 'bar',

    data: {
      labels: months,

      datasets: [{
        label: 'Sales',
        data: salesData,
        backgroundColor: '#a3e635',
        borderRadius: 8,
        barThickness: 35
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false
        },

        tooltip: {
          callbacks: {
            label: (context) =>
              'Sales: ₹' +
              (context.parsed.y ?? 0).toLocaleString('en-IN')
          }
        }
      },

      scales: {
        y: {
          beginAtZero: true,

          ticks: {
            callback: (value) => '₹' + value
          }
        }
      }
    }
  });
}





// REVENUE VS ORDERS COMPARISON

createRevenueOrdersChart(orders: any[] = []): void {

  if (!this.chartReady || !this.dashboardDataLoaded) return;

  this.revenueOrdersChart?.destroy();

  const now = new Date();
  const labels: string[] = [];
  const revenueData: number[] = [];
  const ordersData: number[] = [];

  let periods: {
    label: string;
    start: Date;
    end: Date;
  }[] = [];

  // TODAY
  if (this.selectedDateRange === 'today') {

    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    periods.push({
      label: 'Today',
      start,
      end: now
    });
  }

  // LAST 7 DAYS
  else if (this.selectedDateRange === '7days') {

    for (let i = 6; i >= 0; i--) {

      const start = new Date(now);
      start.setDate(now.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      periods.push({
        label: start.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short'
        }),
        start,
        end
      });
    }
  }

  // LAST 30 DAYS
  else if (this.selectedDateRange === '30days') {

    for (let i = 3; i >= 0; i--) {

      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      end.setDate(now.getDate() - (i * 7));

      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      if (start < thirtyDaysAgo) {
        start.setTime(thirtyDaysAgo.getTime());
      }

      periods.push({
        label: `Week ${4 - i}`,
        start,
        end
      });
    }
  }

  // THIS YEAR
  else if (this.selectedDateRange === 'year') {

    for (let month = 0; month <= now.getMonth(); month++) {

      const start = new Date(now.getFullYear(), month, 1);

      const end = new Date(
        now.getFullYear(),
        month + 1,
        0,
        23, 59, 59, 999
      );

      periods.push({
        label: start.toLocaleString('en-IN', {
          month: 'short'
        }),
        start,
        end
      });
    }
  }

  // ALL TIME
  else {

    const monthMap = new Map<string, Date>();

    orders.forEach(order => {
      const date = new Date(order.createdAt);

      const key = `${date.getFullYear()}-${date.getMonth()}`;

      monthMap.set(key, new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      ));
    });

    const sortedMonths = [...monthMap.entries()]
      .sort((a, b) => a[1].getTime() - b[1].getTime());

    sortedMonths.forEach(([key, start]) => {

      const end = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0,
        23, 59, 59, 999
      );

      periods.push({
        label: start.toLocaleString('en-IN', {
          month: 'short',
          year: 'numeric'
        }),
        start,
        end
      });
    });
  }

  // CALCULATE REVENUE AND ORDER COUNT

  periods.forEach(period => {

    const periodOrders = orders.filter(order => {

      const date = new Date(order.createdAt);

      return order.status?.toLowerCase() !== 'cancelled' &&
             date >= period.start &&
             date <= period.end;
    });

    const revenue = periodOrders.reduce(
      (total, order) => total + Number(order.total || 0),
      0
    );

    labels.push(period.label);
    revenueData.push(revenue);
    ordersData.push(periodOrders.length);
  });

  // CREATE CHART

  this.revenueOrdersChart = new Chart(
    this.revenueOrdersChartRef.nativeElement,
    {
      type: 'bar',

      data: {
        labels,

        datasets: [
          {
            type: 'bar',
            label: 'Revenue',
            data: revenueData,
            backgroundColor: '#a3e635',
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Number of Orders',
            data: ordersData,
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            tension: 0.3,
            pointRadius: 5,
            yAxisID: 'y1'
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
          mode: 'index',
          intersect: false
        },

        plugins: {
          legend: {
            position: 'top'
          }
        },

        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            title: {
              display: true,
              text: 'Revenue (₹)'
            },
            ticks: {
              callback: (value) => '₹' + value
            }
          },

          y1: {
            beginAtZero: true,
            position: 'right',
            title: {
              display: true,
              text: 'Number of Orders'
            },
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              precision: 0
            }
          }
        }
      }
    }
  );
}








  // ORDER STATUS ANALYTICS

  createOrderStatusChart(orders: any[] = []): void {

    if (!this.chartReady || !this.dashboardDataLoaded) return;

    this.orderStatusChart?.destroy();

    const statuses = [
      'Pending',
      'Processing',
      'Shipped',
      'Delivered',
      'Cancelled'
    ];

    const statusCounts = statuses.map(status =>
      orders.filter(
        order => order.status?.toLowerCase() === status.toLowerCase()
      ).length
    );

    this.orderStatusChart = new Chart(
      this.orderStatusChartRef.nativeElement,
      {
        type: 'doughnut',

        data: {
          labels: statuses,

          datasets: [{
            data: statusCounts,

            backgroundColor: [
              '#f59e0b',
              '#3b82f6',
              '#8b5cf6',
              '#16a34a',
              '#ef4444'
            ],

            borderWidth: 0,
            hoverOffset: 8
          }]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',

          plugins: {
            legend: {
              position: 'bottom',

              labels: {
                padding: 20,
                usePointStyle: true
              }
            },

            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.parsed ?? 0;

                  return ` ${context.label}: ${value} orders`;
                }
              }
            }
          }
        }
      }
    );
  }

  // TOP-SELLING PRODUCTS

  createTopSellingChart(orders: any[] = []): void {

    if (!this.chartReady || !this.dashboardDataLoaded) return;

    this.topSellingChart?.destroy();

    const productSales: {
      [key: string]: number
    } = {};

    // Calculate total quantity sold for each product

    orders.forEach(order => {

      if (order.status?.toLowerCase() === 'cancelled') {
        return;
      }

      order.items?.forEach((item: any) => {

        const productName = item.product?.name;

        if (!productName) return;

        productSales[productName] =
          (productSales[productName] || 0) +
          Number(item.quantity || 0);

      });

    });

    // Sort products by quantity sold

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

      this.hasTopSellingProducts = topProducts.length > 0;

// Update Angular view before accessing the canvas
this.cdr.detectChanges();

if (!this.hasTopSellingProducts) {
  return;
}

    const productNames = topProducts.map(
      product => product[0]
    );

    const quantitiesSold = topProducts.map(
      product => product[1]
    );

    // Create chart

    this.topSellingChart = new Chart(
      this.topSellingChartRef.nativeElement,
      {
        type: 'bar',

        data: {
          labels: productNames,

          datasets: [{
            label: 'Units Sold',
            data: quantitiesSold,
           backgroundColor: '#a3e635',
            borderRadius: 8,
            barThickness: 30
          }]
        },

        options: {
          indexAxis: 'y',

          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              display: false
            },

            tooltip: {
              callbacks: {
                label: (context) =>
                  ` ${context.parsed.x ?? 0} units sold`
              }
            }
          },

          scales: {
            x: {
              beginAtZero: true,

              ticks: {
                precision: 0
              }
            },

            y: {
              ticks: {
                autoSkip: false
              }
            }
          }
        }
      }
    );
  }
}