const express = require('express');
const { getTopFilms, getFilmDetails } = require('../controllers/filmsController');

const router = express.Router();

router.get('/top', getTopFilms);
router.get('/:id', getFilmDetails);

module.exports = router;


