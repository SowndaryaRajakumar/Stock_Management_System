import { Notification, Product, Indent } from '../models/index.js';
import { Op } from 'sequelize';

// Helper to format notification
const formatNotification = (n) => {
  const raw = n.toJSON ? n.toJSON() : n;
  return {
    ...raw,
    id: raw.id,
    _id: raw.id,
    userId: raw.user_id,
    type: raw.type,
    title: raw.title,
    message: raw.message,
    referenceId: raw.reference_id,
    referenceType: raw.reference_type,
    isRead: Boolean(raw.is_read),
    date: raw.created_at ? new Date(raw.created_at).toISOString() : new Date().toISOString(),
    createdAt: raw.created_at
  };
};

// @desc    Get notifications for user/role
// @route   GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    // 1. Reconcile LOW_STOCK notifications: resolve any stale low-stock notifications
    const unreadLowStockNotifs = await Notification.findAll({
      where: {
        type: 'LOW_STOCK',
        is_read: false
      }
    });
    for (const notif of unreadLowStockNotifs) {
      if (notif.reference_id) {
        const prod = await Product.findByPk(notif.reference_id);
        if (!prod || prod.active === false || Number(prod.current_quantity) > Number(prod.minimum_quantity)) {
          notif.is_read = true;
          await notif.save();
        }
      }
    }

    // 2. Reconcile INDENT_CREATED notifications: resolve notifications for already actioned indents
    const unreadIndentNotifs = await Notification.findAll({
      where: {
        type: 'INDENT_CREATED',
        is_read: false
      }
    });
    for (const notif of unreadIndentNotifs) {
      if (notif.reference_id) {
        const ind = await Indent.findByPk(notif.reference_id);
        if (!ind || ['APPROVED', 'REJECTED', 'COMPLETED', 'ISSUED'].includes(ind.status)) {
          notif.is_read = true;
          await notif.save();
        }
      }
    }

    // Admin receives all notifications or admin-targeted notifications; Faculty receives user-specific notifications
    const where = isAdmin
      ? { [Op.or]: [{ user_id: userId }, { user_id: 1 }] }
      : { user_id: userId };

    const unreadCount = await Notification.count({
      where: {
        ...where,
        is_read: false
      }
    });

    if (req.query.unread === 'true') {
      where.is_read = false;
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { count: total, rows } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      offset,
      limit
    });

    const formatted = rows.map(formatNotification);

    res.json({
      success: true,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      notifications: formatted,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    notification.is_read = true;
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const where = isAdmin
      ? { [Op.or]: [{ user_id: userId }, { user_id: 1 }] }
      : { user_id: userId };

    await Notification.update(
      { is_read: true },
      { where }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};
