//importing essential files and libraries
const express = require('express');
const database = require('../database');
const router = express.Router();

//importing auth and role files
var auth = require('../services/authentication');
var role = require('../services/checkRole');

//api for getting the details of total number of category, products and bills.
router.get('/details',auth.authenticateToken,(request,response,next)=>{
    var categoryCount;
    var productsCount;
    var billCount;
    var queryi = "select count(id) as categoryCount from category";
    database.query(queryi,(error,results)=>{
        if(!error){
            categoryCount = results[0].categoryCount;
        }
        else{
            return response.status(500).json(error);
        }
    })
    var queryi = "select count(product_id) as productsCount from products";
    database.query(queryi,(error,results)=>{
        if(!error){
            productsCount = results[0].productsCount;
        }
        else{
            return response.status(500).json(error);
        }
    })
    var queryi = "select count(id) as billCount from bill";
    database.query(queryi,(error,results)=>{
        if(!error){
            billCount = results[0].billCount;
            var data = {
                category: categoryCount,
                products: productsCount,
                bill: billCount
            };
            return response.status(200).json(data);
        }
        else{
            return response.status(500).json(error);
        }
    })

})


module.exports = router;