const express = require('express');
const { getCustomers } = require('../controllers/customersController');

const router = express.Router();

router.get('/', getCustomers);

module.exports = router;

