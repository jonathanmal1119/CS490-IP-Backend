const { executeQuery, executeQuerySingle } = require('../config/database');

// @desc    Get top rented films
// @route   GET /api/films/top
// @access  Public
const getTopFilms = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const query = `
      SELECT 
        f.film_id as id,
        f.title,
        f.description,
        f.release_year as releaseYear,
        c.name as genre,
        COUNT(r.rental_id) as rentalCount
      FROM rental r
      JOIN inventory i ON r.inventory_id = i.inventory_id
      JOIN film f ON i.film_id = f.film_id
      JOIN film_category fc ON f.film_id = fc.film_id
      JOIN category c ON fc.category_id = c.category_id
      GROUP BY f.film_id, f.title, c.name
      ORDER BY rentalCount DESC
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


module.exports = {
  getTopFilms
};


