const express = require('express');
const { getTopFilms } = require('../controllers/filmsController');

const router = express.Router();

// Routes
router.get('/top', getTopFilms);

module.exports = router;


