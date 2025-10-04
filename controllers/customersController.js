const { executeQuery } = require('../config/database');

const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    // Build WHERE clause for search
    let whereClause = '';
    let queryParams = [];
    
    if (search.trim()) {
      whereClause = `
        WHERE (
          CAST(C.customer_id AS CHAR) LIKE ? OR
          C.first_name LIKE ? OR
          C.last_name LIKE ?
        )
      `;
      const searchPattern = `%${search.trim()}%`;
      queryParams = [searchPattern, searchPattern, searchPattern];
    }
    
    const customersQuery = `
      SELECT 
        C.customer_id as id,
        C.first_name,
        C.last_name,
        C.email,
        A.address,
        A.district,
        CI.city,
        CO.country,
        C.active,
        C.create_date
      FROM customer C
      JOIN address A ON C.address_id = A.address_id
      JOIN city CI ON A.city_id = CI.city_id
      JOIN country CO ON CI.country_id = CO.country_id
      ${whereClause}
      ORDER BY C.last_name, C.first_name
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM customer C
      JOIN address A ON C.address_id = A.address_id
      JOIN city CI ON A.city_id = CI.city_id
      JOIN country CO ON CI.country_id = CO.country_id
      ${whereClause}
    `;
    
    const [customers, countResult] = await Promise.all([
      executeQuery(customersQuery, [...queryParams, String(limit), String(offset)]),
      executeQuery(countQuery, queryParams)
    ]);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          currentPage: page,
          totalPages,
          totalCustomers: total,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    const customerQuery = `
      SELECT 
        C.customer_id as id,
        C.first_name,
        C.last_name,
        C.email,
        C.address_id,
        A.address,
        A.district,
        A.city_id,
        CI.city,
        CI.country_id,
        CO.country,
        C.active,
        C.create_date
      FROM customer C
      JOIN address A ON C.address_id = A.address_id
      JOIN city CI ON A.city_id = CI.city_id
      JOIN country CO ON CI.country_id = CO.country_id
      WHERE C.customer_id = ?
    `;
    
    const result = await executeQuery(customerQuery, [customerId]);
    
    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error getting customer by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const { first_name, last_name, email, active } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, and email are required'
      });
    }
    
    // Update customer
    const updateQuery = `
      UPDATE customer 
      SET first_name = ?, last_name = ?, email = ?, active = ?
      WHERE customer_id = ?
    `;
    
    const result = await executeQuery(updateQuery, [
      first_name,
      last_name,
      email,
      active ? 1 : 0,
      customerId
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomer
};


