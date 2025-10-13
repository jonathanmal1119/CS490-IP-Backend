const { executeQuery, executeQuerySingle } = require('../config/database');

// @desc    Get top rented films
// @route   GET /api/films/top
// @access  Public
const getTopFilms = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const query = `
      SELECT 
        F.film_id as id,
        F.title,
        C.name as genre,
        COUNT(R.rental_id) as rentalCount
      FROM rental R
      JOIN inventory I ON R.inventory_id = I.inventory_id
      JOIN film F ON I.film_id = F.film_id
      JOIN film_category FC ON F.film_id = FC.film_id
      JOIN category C ON FC.category_id = C.category_id
      GROUP BY F.film_id, F.title, C.name
      ORDER BY COUNT(R.rental_id) DESC
      LIMIT ?
    `;
    
    const films = await executeQuery(query, [String(limit)]);
    
    res.json({
      success: true,
      data: films
    });
  } catch (error) {
    console.error('Error getting top films:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};


const getFilmDetails = async (req, res) => {
  try {
    const filmId = req.params.id;
    
    const query = `
      SELECT 
        F.film_id as id,
        F.title,
        F.description,
        F.release_year as releaseYear,
        F.rating,
        F.length,
        F.replacement_cost as replacementCost,
        F.rental_rate as rentalRate,
        F.rental_duration as rentalDuration,
        C.name as category,
        L.name as language
      FROM film F
      JOIN film_category FC ON F.film_id = FC.film_id
      JOIN category C ON FC.category_id = C.category_id
      JOIN language L ON F.language_id = L.language_id
      WHERE F.film_id = ?
    `;
    
    const film = await executeQuerySingle(query, [filmId]);
    
    if (!film) {
      return res.status(404).json({
        success: false,
        error: 'Film not found'
      });
    }
    
    const actorsQuery = `
      SELECT 
        A.actor_id as id,
        CONCAT(A.first_name, ' ', A.last_name) as name
      FROM actor A
      JOIN film_actor FA ON A.actor_id = FA.actor_id
      WHERE FA.film_id = ?
      ORDER BY A.last_name, A.first_name
    `;
    
    const actors = await executeQuery(actorsQuery, [filmId]);
    
    res.json({
      success: true,
      data: {
        ...film,
        actors
      }
    });
  } catch (error) {
    console.error('Error getting film details:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Search films by name, actor, or genre
// @route   GET /api/films/search
// @access  Public
const searchFilms = async (req, res) => {
  try {
    const { query, type } = req.query;
    
    if (!query || !type) {
      return res.status(400).json({
        success: false,
        error: 'Query and type parameters are required'
      });
    }

    let searchQuery;
    let params;

    switch (type) {
      case 'title':
        searchQuery = `
          SELECT DISTINCT
            F.film_id as id,
            F.title,
            F.description,
            F.release_year as releaseYear,
            F.rating,
            F.length,
            C.name as genre
          FROM film F
          JOIN film_category FC ON F.film_id = FC.film_id
          JOIN category C ON FC.category_id = C.category_id
          WHERE F.title LIKE ?
          ORDER BY F.title
          LIMIT 50
        `;
        params = [`%${query}%`];
        break;

      case 'actor':
        searchQuery = `
          SELECT DISTINCT
            F.film_id as id,
            F.title,
            F.description,
            F.release_year as releaseYear,
            F.rating,
            F.length,
            C.name as genre
          FROM film F
          JOIN film_actor FA ON F.film_id = FA.film_id
          JOIN actor A ON FA.actor_id = A.actor_id
          JOIN film_category FC ON F.film_id = FC.film_id
          JOIN category C ON FC.category_id = C.category_id
          WHERE CONCAT(A.first_name, ' ', A.last_name) LIKE ?
          ORDER BY F.title
          LIMIT 50
        `;
        params = [`%${query}%`];
        break;

      case 'genre':
        searchQuery = `
          SELECT DISTINCT
            F.film_id as id,
            F.title,
            F.description,
            F.release_year as releaseYear,
            F.rating,
            F.length,
            C.name as genre
          FROM film F
          JOIN film_category FC ON F.film_id = FC.film_id
          JOIN category C ON FC.category_id = C.category_id
          WHERE C.name LIKE ?
          ORDER BY F.title
          LIMIT 50
        `;
        params = [`%${query}%`];
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid search type. Must be title, actor, or genre'
        });
    }

    const films = await executeQuery(searchQuery, params);
    
    res.json({
      success: true,
      data: films
    });
  } catch (error) {
    console.error('Error searching films:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get recently released films
// @route   GET /api/films/recent
// @access  Public
const getRecentFilms = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 15;
    
    const query = `
      SELECT DISTINCT
        F.film_id as id,
        F.title,
        F.description,
        F.release_year as releaseYear,
        F.rating,
        F.length,
        C.name as genre
      FROM film F
      JOIN film_category FC ON F.film_id = FC.film_id
      JOIN category C ON FC.category_id = C.category_id
      ORDER BY F.release_year DESC, F.title ASC
      LIMIT ?
    `;
    
    const films = await executeQuery(query, [String(limit)]);
    
    res.json({
      success: true,
      data: films
    });
  } catch (error) {
    console.error('Error getting recent films:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Check available inventory for a film
// @route   GET /api/films/:id/inventory
// @access  Public
const checkInventory = async (req, res) => {
  try {
    const filmId = req.params.id;
    
    const query = `
      SELECT 
        I.inventory_id,
        I.store_id,
        CASE 
          WHEN R.rental_id IS NULL OR R.return_date IS NOT NULL THEN 1
          ELSE 0
        END as available
      FROM inventory I
      LEFT JOIN rental R ON I.inventory_id = R.inventory_id
        AND R.return_date IS NULL
      WHERE I.film_id = ?
      HAVING available = 1
      LIMIT 1
    `;
    
    const inventory = await executeQuery(query, [filmId]);
    
    res.json({
      success: true,
      data: {
        available: inventory.length > 0,
        inventory_id: inventory.length > 0 ? inventory[0].inventory_id : null
      }
    });
  } catch (error) {
    console.error('Error checking inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Rent a film to a customer
// @route   POST /api/films/:id/rent
// @access  Public
const rentFilm = async (req, res) => {
  try {
    const filmId = req.params.id;
    const { customer_id } = req.body;
    
    console.log('Rent film request:', { filmId, customer_id });
    
    if (!customer_id) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }
    
    // Verify customer exists
    const customerQuery = `SELECT customer_id FROM customer WHERE customer_id = ?`;
    const customer = await executeQuerySingle(customerQuery, [customer_id]);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    // Check if film exists and get rental info
    const filmQuery = `SELECT film_id, rental_duration, rental_rate FROM film WHERE film_id = ?`;
    const film = await executeQuerySingle(filmQuery, [filmId]);
    
    if (!film) {
      return res.status(404).json({
        success: false,
        error: 'Film not found'
      });
    }
    
    // Find available inventory
    const inventoryQuery = `
      SELECT 
        I.inventory_id,
        I.store_id
      FROM inventory I
      LEFT JOIN rental R ON I.inventory_id = R.inventory_id
        AND R.return_date IS NULL
      WHERE I.film_id = ? AND R.rental_id IS NULL
      LIMIT 1
    `;
    
    const inventory = await executeQuerySingle(inventoryQuery, [filmId]);
    
    if (!inventory) {
      return res.status(400).json({
        success: false,
        error: 'No copies of this film are currently available for rent'
      });
    }
    
    // Get staff_id for the store (just use the first staff member of the store)
    const staffQuery = `SELECT staff_id FROM staff WHERE store_id = ? LIMIT 1`;
    const staff = await executeQuerySingle(staffQuery, [inventory.store_id]);
    
    if (!staff) {
      return res.status(500).json({
        success: false,
        error: 'No staff available for this rental'
      });
    }
    
    // Create rental record
    const rentalQuery = `
      INSERT INTO rental (rental_date, inventory_id, customer_id, return_date, staff_id, last_update)
      VALUES (NOW(), ?, ?, NULL, ?, NOW())
    `;
    
    const result = await executeQuery(rentalQuery, [
      inventory.inventory_id,
      customer_id,
      staff.staff_id
    ]);
    
    console.log('Rental created:', result);
    
    res.status(201).json({
      success: true,
      message: 'Film rented successfully',
      data: {
        rental_id: result.insertId,
        inventory_id: inventory.inventory_id,
        customer_id: customer_id,
        rental_duration: film.rental_duration,
        rental_rate: film.rental_rate
      }
    });
  } catch (error) {
    console.error('Error renting film:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Return a rented film
// @route   PUT /api/films/rentals/:rentalId/return
// @access  Public
const returnFilm = async (req, res) => {
  try {
    const rentalId = req.params.rentalId;
    
    console.log('Return film request for rental ID:', rentalId);
    
    // Check if rental exists and is not already returned
    const rentalQuery = `
      SELECT rental_id, return_date, customer_id
      FROM rental
      WHERE rental_id = ?
    `;
    
    const rental = await executeQuerySingle(rentalQuery, [rentalId]);
    
    if (!rental) {
      return res.status(404).json({
        success: false,
        error: 'Rental not found'
      });
    }
    
    if (rental.return_date) {
      return res.status(400).json({
        success: false,
        error: 'This rental has already been returned'
      });
    }
    
    // Update rental with return date
    const updateQuery = `
      UPDATE rental
      SET return_date = NOW(), last_update = NOW()
      WHERE rental_id = ?
    `;
    
    await executeQuery(updateQuery, [rentalId]);
    
    console.log('Film returned successfully for rental ID:', rentalId);
    
    res.json({
      success: true,
      message: 'Film returned successfully',
      data: {
        rental_id: rentalId,
        return_date: new Date()
      }
    });
  } catch (error) {
    console.error('Error returning film:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = {
  getTopFilms,
  getFilmDetails,
  searchFilms,
  getRecentFilms,
  checkInventory,
  rentFilm,
  returnFilm
};


