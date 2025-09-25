const express = require('express');
const { getTopActors } = require('../controllers/actorsController');

const router = express.Router();

router.get('/top', getTopActors);

module.exports = router;
