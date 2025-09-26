const { executeQuery, executeQuerySingle } = require('../config/database');

const getTopActors = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const query = `
      SELECT 
        A.actor_id as id,
        CONCAT(A.first_name, ' ', A.last_name) as name,
        COUNT(FA.film_id) as filmCount
      FROM actor A
      JOIN film_actor FA ON A.actor_id = FA.actor_id
      GROUP BY A.actor_id, A.first_name, A.last_name
      ORDER BY COUNT(FA.film_id) DESC
      LIMIT ?
    `;
    
    const actors = await executeQuery(query, [String(limit)]);
    
    res.json({
      success: true,
      data: actors
    });
  } catch (error) {
    console.error('Error getting top actors:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

const getActorDetails = async (req, res) => {
  try {
    const actorId = req.params.id;
    
    const actorQuery = `
      SELECT 
        A.actor_id as id,
        A.first_name,
        A.last_name,
        CONCAT(A.first_name, ' ', A.last_name) as name
      FROM actor A
      WHERE A.actor_id = ?
    `;
    
    const actor = await executeQuerySingle(actorQuery, [actorId]);
    
    if (!actor) {
      return res.status(404).json({
        success: false,
        error: 'Actor not found'
      });
    }
    
    const filmsQuery = `
      SELECT 
        F.film_id as id,
        F.title,
        F.description,
        F.release_year as releaseYear,
        F.rating,
        F.length,
        C.name as category
      FROM film F
      JOIN film_actor FA ON F.film_id = FA.film_id
      JOIN film_category FC ON F.film_id = FC.film_id
      JOIN category C ON FC.category_id = C.category_id
      WHERE FA.actor_id = ?
      ORDER BY F.release_year DESC
      LIMIT 5
    `;
    
    const films = await executeQuery(filmsQuery, [actorId]);
    
    res.json({
      success: true,
      data: {
        ...actor,
        films
      }
    });
  } catch (error) {
    console.error('Error getting actor details:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = {
  getTopActors,
  getActorDetails
};
