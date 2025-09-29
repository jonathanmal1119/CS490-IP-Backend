const { executeQuery } = require('../config/database');

const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
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
      ORDER BY C.last_name, C.first_name
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM customer
    `;
    
    const [customers, countResult] = await Promise.all([
      executeQuery(customersQuery, [String(limit), String(offset)]),
      executeQuery(countQuery)
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

module.exports = {
  getCustomers
};
