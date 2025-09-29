const express = require('express');
const { getTopActors, getActorDetails, getActorFilms } = require('../controllers/actorsController');

const router = express.Router();

router.get('/top', getTopActors);
router.get('/:id/films', getActorFilms);
router.get('/:id', getActorDetails);

module.exports = router;
