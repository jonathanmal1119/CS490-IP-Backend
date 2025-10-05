const { executeQuery } = require('../config/database');

const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
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
        A.phone,
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
        A.phone,
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
    const { first_name, last_name, email, phone, active } = req.body;
    
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, and email are required'
      });
    }
    
    const getAddressQuery = `
      SELECT address_id FROM customer WHERE customer_id = ?
    `;
    const addressResult = await executeQuery(getAddressQuery, [customerId]);
    
    if (addressResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    const addressId = addressResult[0].address_id;
    
    const updateCustomerQuery = `
      UPDATE customer 
      SET first_name = ?, last_name = ?, email = ?, active = ?, last_update = NOW()
      WHERE customer_id = ?
    `;
    
    // Update address with phone
    const updateAddressQuery = `
      UPDATE address 
      SET phone = ?, last_update = NOW()
      WHERE address_id = ?
    `;
    
    await Promise.all([
      executeQuery(updateCustomerQuery, [
        first_name,
        last_name,
        email,
        active ? 1 : 0,
        customerId
      ]),
      executeQuery(updateAddressQuery, [
        phone || '',
        addressId
      ])
    ]);
    
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

const createCustomer = async (req, res) => {
  try {
    const { first_name, last_name, email, address, district, city, phone, country_id, active } = req.body;
    
    if (!first_name || !last_name || !email || !address || !district || !city || !country_id) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: first_name, last_name, email, address, district, city, country_id'
      });
    }
    
    let cityId;
    
    const existingCityQuery = `
      SELECT city_id FROM city WHERE city = ? AND country_id = ? LIMIT 1
    `;
    const existingCity = await executeQuery(existingCityQuery, [city, country_id]);
    
    if (existingCity.length > 0) {
      cityId = existingCity[0].city_id;
    } else {
      const createCityQuery = `
        INSERT INTO city (city, country_id, last_update)
        VALUES (?, ?, NOW())
      `;
      const cityResult = await executeQuery(createCityQuery, [city, country_id]);
      cityId = cityResult.insertId;
    }
    
    const addressQuery = `
      INSERT INTO address (address, address2, district, city_id, postal_code, phone, location, last_update)
      VALUES (?, ?, ?, ?, ?, ?, POINT(0, 0), NOW())
    `;
    
    const addressResult = await executeQuery(addressQuery, [
      address, 
      '',
      district, 
      cityId, 
      '',
      phone || ''
    ]);
    const addressId = addressResult.insertId;
    

    const customerQuery = `
      INSERT INTO customer (store_id, first_name, last_name, email, address_id, active, create_date, last_update)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const customerResult = await executeQuery(customerQuery, [
      1,
      first_name,
      last_name,
      email,
      addressId,
      active ? 1 : 0
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: {
        customer_id: customerResult.insertId,
        address_id: addressId,
        city_id: cityId
      }
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

const getCountries = async (req, res) => {
  try {
    const query = `
      SELECT 
        country_id,
        country
      FROM country
      ORDER BY country
    `;
    
    const countries = await executeQuery(query);
    console.log('Countries found:', countries.length);
    
    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('Error getting countries:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomer,
  createCustomer,
  getCountries
};


