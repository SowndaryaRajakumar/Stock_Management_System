import {
  Department,
  Category,
  Unit,
  StockDocument,
  Product,
  ProductDocumentReference,
  Purchase,
  Transfer,
  User,
  Faculty,
  Indent,
  StockTransaction,
  sequelize
} from '../models/index.js';
import { Op } from 'sequelize';

const mapWithId = (item) => {
  if (!item) return null;
  const raw = item.toJSON ? item.toJSON() : item;
  return {
    ...raw,
    _id: raw.id
  };
};

// ==========================================
// Departments
// ==========================================
export const getDepartments = async (req, res, next) => {
  try {
    const { search, page, limit, all, includeInactive, status } = req.query;
    const showAll = all === 'true' || includeInactive === 'true';
    const where = {};

    if (status) {
      if (status.toLowerCase() === 'active') where.active = true;
      else if (status.toLowerCase() === 'inactive') where.active = false;
    } else if (!showAll) {
      where.active = true;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { code: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    const attachUsageCounts = async (deptList) => {
      if (!deptList.length) return [];
      const deptIds = deptList.map(d => d.id);

      const [userCounts, facultyCounts, indentCounts, transferCounts] = await Promise.all([
        User.findAll({
          attributes: ['department_id', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
          where: { department_id: deptIds },
          group: ['department_id'],
          raw: true
        }),
        Faculty.findAll({
          attributes: ['department_id', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
          where: { department_id: deptIds },
          group: ['department_id'],
          raw: true
        }),
        Indent.findAll({
          attributes: ['department_id', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
          where: { department_id: deptIds },
          group: ['department_id'],
          raw: true
        }),
        Transfer.findAll({
          attributes: ['department_id', [sequelize.fn('COUNT', sequelize.col('id')), 'cnt']],
          where: { department_id: deptIds },
          group: ['department_id'],
          raw: true
        })
      ]);

      const countMap = {};
      userCounts.forEach(r => {
        countMap[r.department_id] = (countMap[r.department_id] || 0) + (parseInt(r.cnt, 10) || 0);
      });
      facultyCounts.forEach(r => {
        countMap[r.department_id] = (countMap[r.department_id] || 0) + (parseInt(r.cnt, 10) || 0);
      });
      indentCounts.forEach(r => {
        countMap[r.department_id] = (countMap[r.department_id] || 0) + (parseInt(r.cnt, 10) || 0);
      });
      transferCounts.forEach(r => {
        countMap[r.department_id] = (countMap[r.department_id] || 0) + (parseInt(r.cnt, 10) || 0);
      });

      return deptList.map(d => {
        const raw = mapWithId(d);
        const count = countMap[d.id] || 0;
        return {
          ...raw,
          active: Boolean(raw.active),
          status: raw.active ? 'ACTIVE' : 'INACTIVE',
          usageCount: count,
          referenceCount: count,
          isReferenced: count > 0
        };
      });
    };

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const { count: total, rows } = await Department.findAndCountAll({
        where,
        order: [['name', 'ASC']],
        offset: (pageNum - 1) * limitNum,
        limit: limitNum
      });

      const departments = await attachUsageCounts(rows);
      return res.json({
        success: true,
        count: departments.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        departments,
        data: departments
      });
    }

    const rows = await Department.findAll({ where, order: [['name', 'ASC']] });
    const departments = await attachUsageCounts(rows);
    res.json({
      success: true,
      count: departments.length,
      total: departments.length,
      departments,
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }
    const [uCount, fCount, iCount, tCount] = await Promise.all([
      User.count({ where: { department_id: dept.id } }),
      Faculty.count({ where: { department_id: dept.id } }),
      Indent.count({ where: { department_id: dept.id } }),
      Transfer.count({ where: { department_id: dept.id } })
    ]);
    const usageCount = uCount + fCount + iCount + tCount;
    const formatted = {
      ...mapWithId(dept),
      active: Boolean(dept.active),
      status: dept.active ? 'ACTIVE' : 'INACTIVE',
      usageCount,
      referenceCount: usageCount,
      isReferenced: usageCount > 0
    };
    res.json({ success: true, department: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, active, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required.' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Department code is required.' });
    }

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    // Check duplicate code or name
    const existing = await Department.findOne({
      where: {
        [Op.or]: [
          sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase()),
          sequelize.where(sequelize.fn('UPPER', sequelize.col('code')), trimmedCode)
        ]
      }
    });

    if (existing) {
      const field = existing.code.toUpperCase() === trimmedCode ? 'code' : 'name';
      return res.status(400).json({
        success: false,
        message: `A department with this ${field} already exists.`
      });
    }

    let isActive = true;
    if (active !== undefined) isActive = Boolean(active);
    else if (status !== undefined) isActive = String(status).toUpperCase() === 'ACTIVE';

    const dept = await Department.create({
      name: trimmedName,
      code: trimmedCode,
      description: description ? description.trim() : '',
      active: isActive
    });

    const formatted = {
      ...mapWithId(dept),
      active: Boolean(dept.active),
      status: dept.active ? 'ACTIVE' : 'INACTIVE',
      usageCount: 0,
      referenceCount: 0,
      isReferenced: false
    };

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      department: formatted,
      data: formatted
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'A department with this name or code already exists.' });
    }
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description, active, status } = req.body;

    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: 'Department name is required.' });
      }
      const duplicateName = await Department.findOne({
        where: {
          [Op.and]: [
            sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase()),
            { id: { [Op.ne]: id } }
          ]
        }
      });
      if (duplicateName) {
        return res.status(400).json({ success: false, message: 'Another department with this name already exists.' });
      }
      dept.name = trimmedName;
    }

    if (code !== undefined) {
      const trimmedCode = code.trim().toUpperCase();
      if (!trimmedCode) {
        return res.status(400).json({ success: false, message: 'Department code is required.' });
      }
      const duplicateCode = await Department.findOne({
        where: {
          [Op.and]: [
            sequelize.where(sequelize.fn('UPPER', sequelize.col('code')), trimmedCode),
            { id: { [Op.ne]: id } }
          ]
        }
      });
      if (duplicateCode) {
        return res.status(400).json({ success: false, message: 'Another department with this code already exists.' });
      }
      dept.code = trimmedCode;
    }

    if (description !== undefined) dept.description = description ? description.trim() : '';
    if (active !== undefined) dept.active = Boolean(active);
    else if (status !== undefined) dept.active = String(status).toUpperCase() === 'ACTIVE';

    await dept.save();

    const [uCount, fCount, iCount, tCount] = await Promise.all([
      User.count({ where: { department_id: dept.id } }),
      Faculty.count({ where: { department_id: dept.id } }),
      Indent.count({ where: { department_id: dept.id } }),
      Transfer.count({ where: { department_id: dept.id } })
    ]);
    const usageCount = uCount + fCount + iCount + tCount;

    const formatted = {
      ...mapWithId(dept),
      active: Boolean(dept.active),
      status: dept.active ? 'ACTIVE' : 'INACTIVE',
      usageCount,
      referenceCount: usageCount,
      isReferenced: usageCount > 0
    };

    res.json({
      success: true,
      message: 'Department updated successfully.',
      department: formatted,
      data: formatted
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'A department with this name or code already exists.' });
    }
    next(error);
  }
};

export const updateDepartmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active, status } = req.body;

    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    let newActive;
    if (active !== undefined) {
      newActive = Boolean(active);
    } else if (status !== undefined) {
      newActive = String(status).toUpperCase() === 'ACTIVE';
    } else {
      newActive = !dept.active;
    }

    dept.active = newActive;
    await dept.save();

    const actionText = newActive ? 'activated' : 'deactivated';
    return res.json({
      success: true,
      message: `Department ${actionText} successfully.`,
      active: dept.active,
      status: dept.active ? 'ACTIVE' : 'INACTIVE'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deactivate, soft } = req.query;
    const isDeactivateReq = deactivate === 'true' || soft === 'true' || req.body?.deactivate === true;

    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    // Check usage across User, Faculty, Indent, Transfer, StockTransaction
    const [uCount, fCount, iCount, tCount, stCount] = await Promise.all([
      User.count({ where: { department_id: dept.id } }),
      Faculty.count({ where: { department_id: dept.id } }),
      Indent.count({ where: { department_id: dept.id } }),
      Transfer.count({ where: { department_id: dept.id } }),
      StockTransaction.count({ where: { department_id: dept.id } })
    ]);
    const usageCount = uCount + fCount + iCount + tCount + stCount;

    if (usageCount > 0) {
      if (isDeactivateReq) {
        dept.active = false;
        await dept.save();
        return res.json({
          success: true,
          message: 'Department deactivated successfully.',
          status: 'INACTIVE',
          active: false
        });
      }

      return res.status(409).json({
        success: false,
        inUse: true,
        usageCount,
        message: `This department is currently referenced (${usageCount} records: users, faculty, indents, or transfers) and cannot be permanently deleted. Deactivate it instead.`
      });
    }

    await dept.destroy();
    return res.json({
      success: true,
      message: 'Department deleted successfully.'
    });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError' || error.original?.errno === 1451) {
      return res.status(409).json({
        success: false,
        inUse: true,
        message: 'This department is currently referenced and cannot be deleted. Deactivate it instead.'
      });
    }
    next(error);
  }
};

// ==========================================
// Categories
// ==========================================
export const getCategories = async (req, res, next) => {
  try {
    const { search, page, limit, all, includeInactive, status } = req.query;
    const showAll = all === 'true' || includeInactive === 'true';
    const where = {};

    if (status) {
      if (status.toLowerCase() === 'active') where.active = true;
      else if (status.toLowerCase() === 'inactive') where.active = false;
    } else if (!showAll) {
      where.active = true;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { description: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    // Attach dynamic product usage counts
    const attachUsageCounts = async (catList) => {
      if (!catList.length) return [];
      const catIds = catList.map(c => c.id);
      const counts = await Product.findAll({
        attributes: [
          'category_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'product_count']
        ],
        where: { category_id: catIds },
        group: ['category_id'],
        raw: true
      });

      const countMap = {};
      counts.forEach(r => {
        countMap[r.category_id] = parseInt(r.product_count, 10) || 0;
      });

      return catList.map(c => {
        const raw = mapWithId(c);
        const count = countMap[c.id] || 0;
        return {
          ...raw,
          active: Boolean(raw.active),
          status: raw.active ? 'ACTIVE' : 'INACTIVE',
          usageCount: count,
          referenceCount: count,
          isReferenced: count > 0
        };
      });
    };

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const { count: total, rows } = await Category.findAndCountAll({
        where,
        order: [['name', 'ASC']],
        offset: (pageNum - 1) * limitNum,
        limit: limitNum
      });

      const categories = await attachUsageCounts(rows);
      return res.json({
        success: true,
        count: categories.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        categories,
        data: categories
      });
    }

    const rows = await Category.findAll({ where, order: [['name', 'ASC']] });
    const categories = await attachUsageCounts(rows);
    res.json({
      success: true,
      count: categories.length,
      total: categories.length,
      categories,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cat = await Category.findByPk(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    const usageCount = await Product.count({ where: { category_id: cat.id } });
    const formatted = {
      ...mapWithId(cat),
      active: Boolean(cat.active),
      status: cat.active ? 'ACTIVE' : 'INACTIVE',
      usageCount,
      referenceCount: usageCount,
      isReferenced: usageCount > 0
    };
    res.json({ success: true, category: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, active, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const trimmedName = name.trim();
    const existing = await Category.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('name')),
        trimmedName.toLowerCase()
      )
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A category with this name already exists.' });
    }

    let isActive = true;
    if (active !== undefined) isActive = Boolean(active);
    else if (status !== undefined) isActive = String(status).toUpperCase() === 'ACTIVE';

    const cat = await Category.create({
      name: trimmedName,
      description: description ? description.trim() : '',
      active: isActive
    });

    const formatted = {
      ...mapWithId(cat),
      active: Boolean(cat.active),
      status: cat.active ? 'ACTIVE' : 'INACTIVE',
      usageCount: 0,
      referenceCount: 0,
      isReferenced: false
    };

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category: formatted,
      data: formatted
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'A category with this name already exists.' });
    }
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, active, status } = req.body;

    const cat = await Category.findByPk(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: 'Category name is required.' });
      }

      const duplicate = await Category.findOne({
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('name')),
              trimmedName.toLowerCase()
            ),
            { id: { [Op.ne]: cat.id } }
          ]
        }
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'A category with this name already exists.' });
      }
      cat.name = trimmedName;
    }

    if (description !== undefined) {
      cat.description = description ? description.trim() : '';
    }

    if (active !== undefined) {
      cat.active = Boolean(active);
    } else if (status !== undefined) {
      cat.active = String(status).toUpperCase() === 'ACTIVE';
    }

    // Ensure category.id primary key remains immutable
    await cat.save();

    const usageCount = await Product.count({ where: { category_id: cat.id } });
    const formatted = {
      ...mapWithId(cat),
      active: Boolean(cat.active),
      status: cat.active ? 'ACTIVE' : 'INACTIVE',
      usageCount,
      referenceCount: usageCount,
      isReferenced: usageCount > 0
    };

    res.json({
      success: true,
      message: 'Category updated successfully.',
      category: formatted,
      data: formatted
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'A category with this name already exists.' });
    }
    next(error);
  }
};

export const updateCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active, status } = req.body;

    const cat = await Category.findByPk(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    let newActive;
    if (active !== undefined) {
      newActive = Boolean(active);
    } else if (status !== undefined) {
      newActive = String(status).toUpperCase() === 'ACTIVE';
    } else {
      newActive = !cat.active;
    }

    cat.active = newActive;
    await cat.save();

    const actionText = newActive ? 'activated' : 'deactivated';
    return res.json({
      success: true,
      message: `Category ${actionText} successfully.`,
      active: cat.active,
      status: cat.active ? 'ACTIVE' : 'INACTIVE'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deactivate, soft } = req.query;
    const isDeactivateReq = deactivate === 'true' || soft === 'true' || req.body?.deactivate === true;

    const cat = await Category.findByPk(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Check how many products currently reference this category
    const usageCount = await Product.count({ where: { category_id: cat.id } });

    if (usageCount > 0) {
      if (isDeactivateReq) {
        cat.active = false;
        await cat.save();
        return res.json({
          success: true,
          message: 'Category deactivated successfully.',
          status: 'INACTIVE',
          active: false
        });
      }

      return res.status(409).json({
        success: false,
        inUse: true,
        usageCount,
        message: `This category is currently used by ${usageCount} product${usageCount === 1 ? '' : 's'} and cannot be deleted. Deactivate it instead.`
      });
    }

    await cat.destroy();
    return res.json({
      success: true,
      message: 'Category deleted successfully.'
    });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError' || error.original?.errno === 1451) {
      return res.status(409).json({
        success: false,
        inUse: true,
        message: 'This category is currently used by products and cannot be deleted. Deactivate it instead.'
      });
    }
    next(error);
  }
};

// ==========================================
// Units
// ==========================================
export const getUnits = async (req, res, next) => {
  try {
    const { search, page, limit, all, includeInactive, status } = req.query;
    const showAll = all === 'true' || includeInactive === 'true';
    const where = {};

    if (status) {
      if (status.toLowerCase() === 'active') where.active = true;
      else if (status.toLowerCase() === 'inactive') where.active = false;
    } else if (!showAll) {
      where.active = true;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { symbol: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    // Attach dynamic product usage counts
    const attachUsageCounts = async (unitList) => {
      if (!unitList.length) return [];
      const unitIds = unitList.map(u => u.id);
      const counts = await Product.findAll({
        attributes: [
          'unit_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'product_count']
        ],
        where: { unit_id: unitIds },
        group: ['unit_id'],
        raw: true
      });

      const countMap = {};
      counts.forEach(r => {
        countMap[r.unit_id] = parseInt(r.product_count, 10) || 0;
      });

      return unitList.map(u => {
        const raw = mapWithId(u);
        const count = countMap[u.id] || 0;
        return {
          ...raw,
          active: Boolean(raw.active),
          status: raw.active ? 'ACTIVE' : 'INACTIVE',
          usageCount: count,
          referenceCount: count,
          isReferenced: count > 0
        };
      });
    };

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const { count: total, rows } = await Unit.findAndCountAll({
        where,
        order: [['name', 'ASC']],
        offset: (pageNum - 1) * limitNum,
        limit: limitNum
      });

      const units = await attachUsageCounts(rows);
      return res.json({
        success: true,
        count: units.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        units,
        data: units
      });
    }

    const rows = await Unit.findAll({ where, order: [['name', 'ASC']] });
    const units = await attachUsageCounts(rows);
    res.json({
      success: true,
      count: units.length,
      total: units.length,
      units,
      data: units
    });
  } catch (error) {
    next(error);
  }
};

export const getUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found.' });
    }
    const usageCount = await Product.count({ where: { unit_id: unit.id } });
    const formatted = {
      ...mapWithId(unit),
      active: Boolean(unit.active),
      status: unit.active ? 'ACTIVE' : 'INACTIVE',
      usageCount,
      referenceCount: usageCount,
      isReferenced: usageCount > 0
    };
    res.json({ success: true, unit: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const createUnit = async (req, res, next) => {
  try {
    const { name, symbol, description, active, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Unit name is required.' });
    }
    if (!symbol || !symbol.trim()) {
      return res.status(400).json({ success: false, message: 'Unit symbol / abbreviation is required.' });
    }

    const trimmedName = name.trim();
    const trimmedSymbol = symbol.trim();

    const existing = await Unit.findOne({
      where: {
        [Op.or]: [
          sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase()),
          sequelize.where(sequelize.fn('LOWER', sequelize.col('symbol')), trimmedSymbol.toLowerCase())
        ]
      }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A unit with this name or symbol already exists.' });
    }

    let isActive = true;
    if (active !== undefined) isActive = Boolean(active);
    else if (status !== undefined) isActive = String(status).toUpperCase() === 'ACTIVE';

    const unit = await Unit.create({
      name: trimmedName,
      symbol: trimmedSymbol,
      description: description ? description.trim() : '',
      active: isActive
    });

    const formatted = {
      ...mapWithId(unit),
      active: Boolean(unit.active),
      status: unit.active ? 'ACTIVE' : 'INACTIVE',
      usageCount: 0,
      referenceCount: 0,
      isReferenced: false
    };

    res.status(201).json({
      success: true,
      message: 'Unit created successfully.',
      unit: formatted,
      data: formatted
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'A unit with this name or symbol already exists.' });
    }
    next(error);
  }
};

export const updateUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, symbol, description, active, status } = req.body;

    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found.' });
    }

    if (name !== undefined || symbol !== undefined) {
      const checkName = (name !== undefined ? name.trim() : unit.name).toLowerCase();
      const checkSymbol = (symbol !== undefined ? symbol.trim() : unit.symbol).toLowerCase();

      const duplicate = await Unit.findOne({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), checkName),
                sequelize.where(sequelize.fn('LOWER', sequelize.col('symbol')), checkSymbol)
              ]
            },
            { id: { [Op.ne]: unit.id } }
          ]
        }
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'A unit with this name or symbol already exists.' });
      }

      if (name !== undefined) unit.name = name.trim();
      if (symbol !== undefined) unit.symbol = symbol.trim();
    }

    if (description !== undefined) {
      unit.description = description ? description.trim() : '';
    }

    if (active !== undefined) {
      unit.active = Boolean(active);
    } else if (status !== undefined) {
      unit.active = String(status).toUpperCase() === 'ACTIVE';
    }

    // Keep unit.id immutable
    await unit.save();

    const usageCount = await Product.count({ where: { unit_id: unit.id } });
    const formatted = {
      ...mapWithId(unit),
      active: Boolean(unit.active),
      status: unit.active ? 'ACTIVE' : 'INACTIVE',
      usageCount,
      referenceCount: usageCount,
      isReferenced: usageCount > 0
    };

    res.json({
      success: true,
      message: 'Unit updated successfully.',
      unit: formatted,
      data: formatted
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'A unit with this name or symbol already exists.' });
    }
    next(error);
  }
};

export const updateUnitStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active, status } = req.body;

    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found.' });
    }

    let newActive;
    if (active !== undefined) {
      newActive = Boolean(active);
    } else if (status !== undefined) {
      newActive = String(status).toUpperCase() === 'ACTIVE';
    } else {
      newActive = !unit.active;
    }

    unit.active = newActive;
    await unit.save();

    const actionText = newActive ? 'activated' : 'deactivated';
    return res.json({
      success: true,
      message: `Unit ${actionText} successfully.`,
      active: unit.active,
      status: unit.active ? 'ACTIVE' : 'INACTIVE'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deactivate, soft } = req.query;
    const isDeactivateReq = deactivate === 'true' || soft === 'true' || req.body?.deactivate === true;

    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Unit not found.' });
    }

    // Check how many products currently reference this unit
    const usageCount = await Product.count({ where: { unit_id: unit.id } });

    if (usageCount > 0) {
      if (isDeactivateReq) {
        unit.active = false;
        await unit.save();
        return res.json({
          success: true,
          message: 'Unit deactivated successfully.',
          status: 'INACTIVE',
          active: false
        });
      }

      return res.status(409).json({
        success: false,
        inUse: true,
        usageCount,
        message: `This unit is currently used by ${usageCount} product${usageCount === 1 ? '' : 's'} and cannot be deleted. Deactivate it instead.`
      });
    }

    await unit.destroy();
    return res.json({
      success: true,
      message: 'Unit deleted successfully.'
    });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError' || error.original?.errno === 1451) {
      return res.status(409).json({
        success: false,
        inUse: true,
        message: 'This unit is currently used by products and cannot be deleted. Deactivate it instead.'
      });
    }
    next(error);
  }
};

// ==========================================
// Stock Documents / Registers
// ==========================================
export const getStockDocuments = async (req, res, next) => {
  try {
    const { search, page, limit, all, includeInactive } = req.query;
    const showAll = all === 'true' || includeInactive === 'true';
    const where = {};
    if (!showAll) {
      where.active = true;
    }

    if (search) {
      where[Op.or] = [
        { document_code: { [Op.like]: `%${search.trim()}%` } },
        { document_name: { [Op.like]: `%${search.trim()}%` } }
      ];
    }

    // Helper to calculate dynamic usage and reference counts
    const attachUsageCounts = async (documentsList) => {
      if (!documentsList.length) return [];

      const docIds = documentsList.map(d => d.id);

      // 1. Distinct products count via product_document_references
      const pdrCounts = await ProductDocumentReference.findAll({
        attributes: [
          'stock_document_id',
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('product_id'))), 'product_count'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'ref_count']
        ],
        where: { stock_document_id: docIds },
        group: ['stock_document_id'],
        raw: true
      });

      // 2. Direct product assignments via products.stock_register_id
      const prodCounts = await Product.findAll({
        attributes: [
          'stock_register_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'product_count']
        ],
        where: { stock_register_id: docIds },
        group: ['stock_register_id'],
        raw: true
      });

      // 3. Purchase references
      const purchaseCounts = await Purchase.findAll({
        attributes: [
          'stock_register_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { stock_register_id: docIds },
        group: ['stock_register_id'],
        raw: true
      });

      // 4. Transfer references
      const transferCounts = await Transfer.findAll({
        attributes: [
          'stock_register_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { stock_register_id: docIds },
        group: ['stock_register_id'],
        raw: true
      });

      const pdrMap = {};
      pdrCounts.forEach(r => {
        pdrMap[r.stock_document_id] = {
          products: parseInt(r.product_count, 10) || 0,
          refs: parseInt(r.ref_count, 10) || 0
        };
      });

      const prodMap = {};
      prodCounts.forEach(r => {
        prodMap[r.stock_register_id] = parseInt(r.product_count, 10) || 0;
      });

      const purchMap = {};
      purchaseCounts.forEach(r => {
        purchMap[r.stock_register_id] = parseInt(r.count, 10) || 0;
      });

      const transMap = {};
      transferCounts.forEach(r => {
        transMap[r.stock_register_id] = parseInt(r.count, 10) || 0;
      });

      return documentsList.map(doc => {
        const raw = mapWithId(doc);
        const pdrData = pdrMap[doc.id] || { products: 0, refs: 0 };
        const directProducts = prodMap[doc.id] || 0;
        const purchaseRefs = purchMap[doc.id] || 0;
        const transferRefs = transMap[doc.id] || 0;

        const distinctProducts = Math.max(pdrData.products, directProducts);
        const totalRefs = pdrData.refs + directProducts + purchaseRefs + transferRefs;

        return {
          ...raw,
          name: raw.document_code || raw.document_name,
          code: raw.document_code,
          sheetName: raw.document_code,
          active: Boolean(raw.active),
          status: raw.active ? 'ACTIVE' : 'INACTIVE',
          usageCount: distinctProducts,
          referenceCount: totalRefs,
          isReferenced: totalRefs > 0
        };
      });
    };

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const { count: total, rows } = await StockDocument.findAndCountAll({
        where,
        order: [['document_code', 'ASC']],
        offset: (pageNum - 1) * limitNum,
        limit: limitNum
      });

      const documents = await attachUsageCounts(rows);

      return res.json({
        success: true,
        count: documents.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        documents,
        stockDocuments: documents,
        data: documents
      });
    }

    const rows = await StockDocument.findAll({ where, order: [['document_code', 'ASC']] });
    const documents = await attachUsageCounts(rows);

    res.json({
      success: true,
      count: documents.length,
      total: documents.length,
      documents,
      stockDocuments: documents,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

export const getStockDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await StockDocument.findByPk(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Stock document not found.' });
    }

    const [pdrCount, productCount, purchaseCount, transferCount] = await Promise.all([
      ProductDocumentReference.count({ where: { stock_document_id: doc.id } }),
      Product.count({ where: { stock_register_id: doc.id } }),
      Purchase.count({ where: { stock_register_id: doc.id } }),
      Transfer.count({ where: { stock_register_id: doc.id } })
    ]);

    const totalRefs = pdrCount + productCount + purchaseCount + transferCount;
    const distinctProducts = Math.max(pdrCount, productCount);

    const formatted = {
      ...mapWithId(doc),
      name: doc.document_code,
      code: doc.document_code,
      sheetName: doc.document_code,
      active: Boolean(doc.active),
      status: doc.active ? 'ACTIVE' : 'INACTIVE',
      usageCount: distinctProducts,
      referenceCount: totalRefs,
      isReferenced: totalRefs > 0
    };

    res.json({ success: true, document: formatted, stockDocument: formatted, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const createStockDocument = async (req, res, next) => {
  try {
    const { documentCode, code, name, documentName, description, active, status } = req.body;
    const resolvedCode = (documentCode || code || name || '').trim().toUpperCase();
    const resolvedName = (documentName || name || resolvedCode).trim();

    if (!resolvedCode) {
      return res.status(400).json({ success: false, message: 'Register code is required.' });
    }

    const existing = await StockDocument.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('document_code')),
        resolvedCode.toLowerCase()
      )
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A stock register with this code already exists.' });
    }

    let isActive = true;
    if (active !== undefined) isActive = Boolean(active);
    else if (status !== undefined) isActive = String(status).toUpperCase() === 'ACTIVE';

    const doc = await StockDocument.create({
      document_code: resolvedCode,
      document_name: resolvedName,
      description: description ? description.trim() : '',
      active: isActive
    });

    const formatted = {
      ...mapWithId(doc),
      name: doc.document_code,
      code: doc.document_code,
      sheetName: doc.document_code,
      active: Boolean(doc.active),
      status: doc.active ? 'ACTIVE' : 'INACTIVE',
      usageCount: 0,
      referenceCount: 0,
      isReferenced: false
    };

    res.status(201).json({
      success: true,
      message: 'Stock register created successfully.',
      document: formatted,
      stockDocument: formatted,
      data: formatted
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'A stock register with this code already exists.' });
    }
    next(error);
  }
};

export const updateStockDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { documentCode, code, documentName, name, description, active, status } = req.body;

    const doc = await StockDocument.findByPk(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Stock document not found.' });
    }

    const newCode = (documentCode || code || name);
    const oldCode = doc.document_code;

    if (newCode && newCode.trim()) {
      const trimmedCode = newCode.trim().toUpperCase();
      const duplicate = await StockDocument.findOne({
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('document_code')),
              trimmedCode.toLowerCase()
            ),
            { id: { [Op.ne]: doc.id } }
          ]
        }
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'A stock register with this code already exists.' });
      }
      doc.document_code = trimmedCode;
    }

    if (documentName || name) {
      doc.document_name = (documentName || name).trim();
    }
    if (description !== undefined) {
      doc.description = description ? description.trim() : '';
    }
    if (active !== undefined) {
      doc.active = Boolean(active);
    } else if (status !== undefined) {
      doc.active = String(status).toUpperCase() === 'ACTIVE';
    }

    // Keep primary key doc.id immutable
    await doc.save();

    // Keep product_document_references.stock_document_name in sync
    if (doc.document_code !== oldCode || documentName) {
      await ProductDocumentReference.update(
        { stock_document_name: doc.document_name || doc.document_code },
        { where: { stock_document_id: doc.id } }
      ).catch(() => {});
    }

    const [pdrCount, productCount, purchaseCount, transferCount] = await Promise.all([
      ProductDocumentReference.count({ where: { stock_document_id: doc.id } }),
      Product.count({ where: { stock_register_id: doc.id } }),
      Purchase.count({ where: { stock_register_id: doc.id } }),
      Transfer.count({ where: { stock_register_id: doc.id } })
    ]);
    const totalRefs = pdrCount + productCount + purchaseCount + transferCount;
    const distinctProducts = Math.max(pdrCount, productCount);

    const formatted = {
      ...mapWithId(doc),
      name: doc.document_code,
      code: doc.document_code,
      sheetName: doc.document_code,
      active: Boolean(doc.active),
      status: doc.active ? 'ACTIVE' : 'INACTIVE',
      usageCount: distinctProducts,
      referenceCount: totalRefs,
      isReferenced: totalRefs > 0
    };

    res.json({
      success: true,
      message: 'Stock register updated successfully.',
      document: formatted,
      stockDocument: formatted,
      data: formatted
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'A stock register with this code already exists.' });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError' || error.original?.errno === 1451) {
      return res.status(409).json({
        success: false,
        message: 'Cannot update this stock register due to existing relationships. Primary references cannot be altered.'
      });
    }
    next(error);
  }
};

export const updateStockDocumentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active, status } = req.body;

    const doc = await StockDocument.findByPk(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Stock document not found.' });
    }

    let newActive;
    if (active !== undefined) {
      newActive = Boolean(active);
    } else if (status !== undefined) {
      newActive = String(status).toUpperCase() === 'ACTIVE';
    } else {
      newActive = !doc.active; // toggle
    }

    doc.active = newActive;
    await doc.save();

    const actionText = newActive ? 'activated' : 'deactivated';
    return res.json({
      success: true,
      message: `Stock register ${actionText} successfully.`,
      active: doc.active,
      status: doc.active ? 'ACTIVE' : 'INACTIVE'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStockDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deactivate, soft } = req.query;
    const isDeactivateReq = deactivate === 'true' || soft === 'true' || req.body?.deactivate === true;

    const doc = await StockDocument.findByPk(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Stock document not found.' });
    }

    // Check references across all 4 related tables
    const [pdrCount, productCount, purchaseCount, transferCount] = await Promise.all([
      ProductDocumentReference.count({ where: { stock_document_id: doc.id } }),
      Product.count({ where: { stock_register_id: doc.id } }),
      Purchase.count({ where: { stock_register_id: doc.id } }),
      Transfer.count({ where: { stock_register_id: doc.id } })
    ]);

    const totalRefs = pdrCount + productCount + purchaseCount + transferCount;
    const distinctProducts = Math.max(pdrCount, productCount);

    if (totalRefs > 0) {
      // If user requested safe deactivation / soft delete
      if (isDeactivateReq) {
        doc.active = false;
        await doc.save();
        return res.json({
          success: true,
          message: 'Stock register deactivated successfully.',
          status: 'INACTIVE',
          active: false
        });
      }

      // Block physical deletion and return clear, user-friendly 409 Conflict
      return res.status(409).json({
        success: false,
        inUse: true,
        referenceCount: totalRefs,
        usageCount: distinctProducts,
        message: `This stock register is currently used by ${distinctProducts} product${distinctProducts === 1 ? '' : 's'} and cannot be deleted. Deactivate it instead.`
      });
    }

    // 0 references: Safe to physically delete
    await doc.destroy();
    return res.json({
      success: true,
      message: 'Stock register deleted successfully.'
    });
  } catch (error) {
    // Intercept foreign key constraint error if somehow triggered
    if (error.name === 'SequelizeForeignKeyConstraintError' || error.original?.errno === 1451) {
      return res.status(409).json({
        success: false,
        inUse: true,
        message: 'This stock register is currently used by products and cannot be deleted. Deactivate it instead.'
      });
    }
    next(error);
  }
};
