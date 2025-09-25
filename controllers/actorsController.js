const { executeQuery } = require('../config/database');

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

module.exports = {
  getTopActors
};
