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


module.exports = {
  getTopFilms
};


