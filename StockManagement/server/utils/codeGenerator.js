import { Product, Purchase, Transfer, Indent } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Helper to find max numeric suffix for a given prefix and table column in MySQL
 */
const getNextSequence = async (Model, field, prefix) => {
  try {
    const items = await Model.findAll({
      attributes: [field],
      where: {
        [field]: {
          [Op.like]: `${prefix}-%`
        }
      },
      raw: true
    });

    const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
    let maxNum = 0;
    for (const item of items) {
      const val = item[field] || '';
      const match = val.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    let nextNum = maxNum + 1;
    let code = `${prefix}-${String(nextNum).padStart(4, '0')}`;

    while (await Model.findOne({ where: { [field]: code } })) {
      nextNum += 1;
      code = `${prefix}-${String(nextNum).padStart(4, '0')}`;
    }

    return code;
  } catch (error) {
    const count = await Model.count();
    let nextNum = count + 1;
    let code = `${prefix}-${String(nextNum).padStart(4, '0')}`;
    while (await Model.findOne({ where: { [field]: code } })) {
      nextNum += 1;
      code = `${prefix}-${String(nextNum).padStart(4, '0')}`;
    }
    return code;
  }
};

/**
 * Generate next sequential product code: CON-0001, CON-0002, etc.
 */
export const generateProductCode = async () => {
  return await getNextSequence(Product, 'product_code', 'CON');
};

/**
 * Generate next sequential purchase number: PUR-0001, PUR-0002, etc.
 */
export const generatePurchaseNumber = async () => {
  return await getNextSequence(Purchase, 'purchase_number', 'PUR');
};

/**
 * Generate next sequential transfer number: TRF-0001, TRF-0002, etc.
 */
export const generateTransferNumber = async () => {
  return await getNextSequence(Transfer, 'transfer_number', 'TRF');
};

/**
 * Generate next sequential indent number: IND-0001, IND-0002, etc.
 */
export const generateIndentNumber = async () => {
  return await getNextSequence(Indent, 'indent_number', 'IND');
};
