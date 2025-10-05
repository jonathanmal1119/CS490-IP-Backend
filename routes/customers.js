const express = require('express');
const { getCustomers, getCustomerById, updateCustomer, createCustomer, getCountries } = require('../controllers/customersController');

const router = express.Router();

router.get('/', getCustomers);
router.get('/countries', getCountries);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);

module.exports = router;


