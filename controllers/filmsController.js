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

module.exports = {
  getTopFilms,
  getFilmDetails,
  searchFilms,
  getRecentFilms
};


