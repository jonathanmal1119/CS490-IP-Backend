const express = require('express');
const { getTopFilms, getFilmDetails, searchFilms, getRecentFilms } = require('../controllers/filmsController');

const router = express.Router();

router.get('/top', getTopFilms);
router.get('/recent', getRecentFilms);
router.get('/search', searchFilms);
router.get('/:id', getFilmDetails);

module.exports = router;


