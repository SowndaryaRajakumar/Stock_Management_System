import { Product, StockTransaction, Indent, IndentItem, Category, Purchase, Transfer, Department, User, StockDocument } from '../models/index.js';
import { formatProduct, formatStockTransaction, formatIndent } from '../utils/formatters.js';
import { Op } from 'sequelize';

// @desc    Get dashboard summary metrics and statistics
// @route   GET /api/dashboard & GET /api/analytics/dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Core entity counts directly from MySQL
    const [
      totalProducts,
      totalCategories,
      totalPurchases,
      totalTransfers,
      pendingIndentCount
    ] = await Promise.all([
      Product.count({ where: { active: true } }),
      Category.count({ where: { active: true } }),
      Purchase.count(),
      Transfer.count(),
      Indent.count({ where: { status: { [Op.in]: ['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'RECOMMENDED'] } } })
    ]);

    const products = await Product.findAll({
      where: { active: true },
      include: ['category', 'unit', 'stockDocument', 'documentReferences']
    });

    const formattedProducts = products.map(formatProduct);
    const totalCurrentStock = formattedProducts.reduce((sum, p) => sum + (Number(p.currentQuantity) || 0), 0);

    const lowStockProducts = formattedProducts.filter(p => p.isLowStock);
    const lowStockCount = lowStockProducts.length;

    // Today's movement quantities
    const todayPurchases = await Purchase.findAll({ where: { purchase_date: todayStr } });
    const todayPurchased = todayPurchases.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

    const todayTransfersList = await Transfer.findAll({ where: { transfer_date: todayStr } });
    const todayTransferred = todayTransfersList.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);

    // Recent transactions (latest 10)
    const recentTransactionsRaw = await StockTransaction.findAll({
      include: [
        { model: Product, as: 'product' },
        { model: Department, as: 'department' },
        { model: User, as: 'recorder' }
      ],
      order: [['transaction_date', 'DESC'], ['id', 'DESC']],
      limit: 10
    });
    const recentTransactions = recentTransactionsRaw.map(formatStockTransaction);

    // Faculty role-specific metrics
    let facultyStats = null;
    let indentWhere = {};
    const isFacultyUser = req.user && req.user.role?.toUpperCase() === 'FACULTY';
    if (isFacultyUser) {
      const allowedRequesterIds = [req.user.id];
      if (req.user.facultyId) {
        allowedRequesterIds.push(req.user.facultyId);
      }
      indentWhere = { requested_by: { [Op.in]: allowedRequesterIds } };

      const [myTotalRequests, myPendingRequests, myApprovedRequests, myRejectedRequests, myCompletedRequests] = await Promise.all([
        Indent.count({ where: indentWhere }),
        Indent.count({ where: { ...indentWhere, status: { [Op.in]: ['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'RECOMMENDED', 'DRAFT'] } } }),
        Indent.count({ where: { ...indentWhere, status: { [Op.in]: ['APPROVED', 'PARTIALLY_APPROVED'] } } }),
        Indent.count({ where: { ...indentWhere, status: 'REJECTED' } }),
        Indent.count({ where: { ...indentWhere, status: { [Op.in]: ['COMPLETED', 'ISSUED'] } } })
      ]);

      facultyStats = {
        myTotalRequests,
        myPendingRequests,
        myApprovedRequests,
        myRejectedRequests,
        myCompletedRequests,
        availableCatalogCount: totalProducts
      };
    }

    const recentIndentsRaw = await Indent.findAll({
      where: indentWhere,
      include: [
        { model: Department, as: 'department' },
        { model: User, as: 'requester' },
        { model: IndentItem, as: 'items', include: ['product'] }
      ],
      order: [['id', 'DESC']],
      limit: 5
    }).catch((err) => {
      console.error('Error fetching recent indents in getDashboardStats:', err);
      return [];
    });
    const recentIndents = recentIndentsRaw.map(formatIndent);

    res.json({
      success: true,
      role: req.user?.role || 'FACULTY',
      totalProducts,
      totalCategories,
      totalCurrentStock,
      lowStockCount,
      totalPurchases,
      totalTransfers,
      pendingIndentCount,
      recentTransactions: req.user?.role === 'ADMIN' ? recentTransactions : [],
      recentActivity: req.user?.role === 'ADMIN' ? recentTransactions : [],
      lowStockProducts: req.user?.role === 'ADMIN' ? lowStockProducts : [],
      lowStockItems: req.user?.role === 'ADMIN' ? lowStockProducts.slice(0, 5) : [],
      recentIndents,
      facultyStats,
      stats: {
        totalProducts,
        totalCategories,
        currentStock: totalCurrentStock,
        totalCurrentStock,
        lowStockCount,
        purchases: totalPurchases,
        transfers: totalTransfers,
        totalPurchases,
        totalTransfers,
        pendingIndents: pendingIndentCount,
        pendingIndentCount,
        todayPurchased,
        todayTransferred,
        myTotalRequests: facultyStats?.myTotalRequests || 0,
        myPendingRequests: facultyStats?.myPendingRequests || 0,
        myApprovedRequests: facultyStats?.myApprovedRequests || 0,
        myRejectedRequests: facultyStats?.myRejectedRequests || 0,
        myCompletedRequests: facultyStats?.myCompletedRequests || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed analytics overview
// @route   GET /api/analytics/overview
export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthStartStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
    const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
    const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const weekAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = `${weekAgoDate.getFullYear()}-${String(weekAgoDate.getMonth() + 1).padStart(2, '0')}-${String(weekAgoDate.getDate()).padStart(2, '0')}`;

    const [products, purchases, transfers, indents, stockDocs] = await Promise.all([
      Product.findAll({
        include: ['category', 'unit', 'stockDocument', 'documentReferences']
      }),
      Purchase.findAll({
        include: ['product', 'stockDocument'],
        order: [['purchase_date', 'ASC']]
      }),
      Transfer.findAll({
        include: ['product', 'department', 'stockDocument'],
        order: [['transfer_date', 'ASC']]
      }),
      Indent.findAll({
        include: ['department']
      }),
      StockDocument.findAll({
        where: { active: true },
        order: [['id', 'ASC']]
      }).catch(() => [])
    ]);

    // Inventory metrics
    let totalStock = 0;
    let lowStockCount = 0;
    let criticalStockCount = 0;
    const categoryMap = {};
    const registerMap = {};

    // Initialize registerMap with existing stock registers (e.g. CSSR1, SR1, SR2, SR3)
    stockDocs.forEach(doc => {
      const code = doc.document_code || doc.document_name;
      if (code) {
        registerMap[code] = 0;
      }
    });

    products.forEach(p => {
      const qty = Number(p.current_quantity || 0);
      const minQty = Number(p.minimum_quantity !== undefined ? p.minimum_quantity : (p.minimum_stock_level || 0));

      totalStock += qty;

      if (qty <= minQty) {
        lowStockCount++;
      }
      if (qty <= minQty * 0.5 || qty === 0) {
        criticalStockCount++;
      }

      // Category breakdown
      const cat = p.category?.name || 'Uncategorized';
      categoryMap[cat] = (categoryMap[cat] || 0) + qty;

      // Stock Register breakdown
      const regCode = p.stockDocument?.document_code || (p.stock_register_id ? `HW-SR${p.stock_register_id}` : 'HW-SR1');
      registerMap[regCode] = (registerMap[regCode] || 0) + qty;
    });

    const categoryDistribution = Object.keys(categoryMap).map(name => ({
      name,
      value: categoryMap[name],
      stock: categoryMap[name]
    }));

    const registerDistribution = Object.keys(registerMap).map(name => ({
      name,
      code: name,
      value: registerMap[name],
      stock: registerMap[name]
    }));

    // Purchases metrics
    let monthlyPurchases = 0;
    let todayPurchased = 0;
    let weeklyPurchases = 0;
    const dailyPurchaseMap = {};

    purchases.forEach(p => {
      const qty = Number(p.quantity || 0);
      const pDate = p.purchase_date ? String(p.purchase_date).substring(0, 10) : '';

      if (pDate >= monthStartStr && pDate < nextMonthStr) {
        monthlyPurchases += qty;
      }
      if (pDate === todayStr) {
        todayPurchased += qty;
      }
      if (pDate >= weekAgoStr) {
        weeklyPurchases += qty;
      }
      if (pDate) {
        dailyPurchaseMap[pDate] = (dailyPurchaseMap[pDate] || 0) + qty;
      }
    });

    // Transfers metrics
    let monthlyTransfers = 0;
    let todayTransferred = 0;
    let weeklyTransfers = 0;
    const dailyTransferMap = {};
    const deptTransferMap = {};

    transfers.forEach(t => {
      const qty = Number(t.quantity || 0);
      const tDate = t.transfer_date ? String(t.transfer_date).substring(0, 10) : '';

      if (tDate >= monthStartStr && tDate < nextMonthStr) {
        monthlyTransfers += qty;
      }
      if (tDate === todayStr) {
        todayTransferred += qty;
      }
      if (tDate >= weekAgoStr) {
        weeklyTransfers += qty;
      }
      if (tDate) {
        dailyTransferMap[tDate] = (dailyTransferMap[tDate] || 0) + qty;
      }

      const deptCode = t.department?.code || t.department?.name || 'General';
      const deptName = t.department?.name || deptCode;
      if (!deptTransferMap[deptCode]) {
        deptTransferMap[deptCode] = {
          department: deptCode,
          name: deptName,
          quantity: 0,
          count: 0
        };
      }
      deptTransferMap[deptCode].quantity += qty;
      deptTransferMap[deptCode].count += qty;
    });

    const departmentTransfers = Object.values(deptTransferMap);

    // Continuous 14-day stock movement trends timeline
    const trends = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      trends.push({
        date: dateStr,
        purchases: dailyPurchaseMap[dateStr] || 0,
        transfers: dailyTransferMap[dateStr] || 0
      });
    }

    // Indent Requisitions status breakdown
    let pendingIndents = 0;
    let approvedIndents = 0;
    let completedIndents = 0;
    let rejectedIndents = 0;

    indents.forEach(ind => {
      const s = (ind.status || '').toUpperCase();
      if (['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'RECOMMENDED'].includes(s)) {
        pendingIndents++;
      } else if (['APPROVED', 'ISSUED'].includes(s)) {
        approvedIndents++;
      } else if (['COMPLETED'].includes(s)) {
        completedIndents++;
      } else if (['REJECTED', 'CANCELLED'].includes(s)) {
        rejectedIndents++;
      }
    });

    const inventoryData = {
      totalStock,
      totalProducts: products.length,
      lowStockCount,
      criticalStockCount,
      categoryDistribution,
      registerDistribution
    };

    const purchasesData = {
      monthlyPurchases,
      todayPurchased,
      weeklyPurchases,
      totalPurchases: purchases.length
    };

    const transfersData = {
      monthlyTransfers,
      todayTransferred,
      weeklyTransfers,
      totalTransfers: transfers.length,
      departmentTransfers
    };

    const indentsData = {
      total: indents.length,
      pending: pendingIndents,
      approved: approvedIndents,
      completed: completedIndents,
      rejected: rejectedIndents
    };

    res.json({
      success: true,
      inventory: inventoryData,
      purchases: purchasesData,
      transfers: transfersData,
      indents: indentsData,
      trends,
      totalProducts: products.length,
      totalPurchases: purchases.length,
      totalTransfers: transfers.length,
      totalIndents: indents.length,
      categoryDistribution,
      departmentUsage: departmentTransfers,
      monthlyTrends: trends,
      data: {
        inventory: inventoryData,
        purchases: purchasesData,
        transfers: transfersData,
        indents: indentsData,
        trends,
        categoryDistribution,
        departmentUsage: departmentTransfers,
        monthlyTrends: trends
      }
    });
  } catch (error) {
    next(error);
  }
};
