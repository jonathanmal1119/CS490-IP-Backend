const express = require('express');
const { getCustomers, getCustomerById, updateCustomer } = require('../controllers/customersController');

const router = express.Router();

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);

module.exports = router;


