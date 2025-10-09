const express = require('express');
const { getTopFilms, getFilmDetails, searchFilms, getRecentFilms, checkInventory, rentFilm } = require('../controllers/filmsController');

const router = express.Router();

router.get('/top', getTopFilms);
router.get('/recent', getRecentFilms);
router.get('/search', searchFilms);
router.get('/:id', getFilmDetails);
router.get('/:id/inventory', checkInventory);
router.post('/:id/rent', rentFilm);

module.exports = router;


