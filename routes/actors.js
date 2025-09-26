const express = require('express');
const { getTopActors, getActorDetails } = require('../controllers/actorsController');

const router = express.Router();

router.get('/top', getTopActors);
router.get('/:id', getActorDetails);

module.exports = router;
