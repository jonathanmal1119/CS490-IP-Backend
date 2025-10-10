const express = require('express');
const { getCustomers, getCustomerById, updateCustomer, createCustomer, getCountries, checkCustomerRentals, deleteCustomer, getCustomerRentalHistory } = require('../controllers/customersController');

const router = express.Router();

router.get('/', getCustomers);
router.get('/countries', getCountries);
router.get('/:id', getCustomerById);
router.get('/:id/rentals', checkCustomerRentals);
router.get('/:id/rental-history', getCustomerRentalHistory);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;


