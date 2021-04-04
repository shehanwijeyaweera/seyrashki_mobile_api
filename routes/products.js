const { Product } = require("../models/product");
const express = require("express");
const { Category } = require("../models/category");
const router = express.Router();
const mongoose = require("mongoose");

//get all products
router.get(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories)
  {
     filter = { category: req.query.categories.split(',') }
  }
  const productList = await Product.find(filter).populate("category");
  //below code snippet can be used to display only the required fields of data
  // by using (-) we can exclude id
  //const productList = await Product.find().select('name image -_id');

  if (!productList) {
    res.status(500).json({ success: false });
  }

  res.send(productList);
});

//get product details
router.get(`/:id`, async (req, res) => {
  // (.populate) keyword can be used to display category data inside the product details
  // as well rather than just displaying the category id.
  const product = await Product.findById(req.params.id).populate("category");

  if (!product) {
    res.status(500).json({ success: false });
  }

  res.send(product);
});

//add new product
router.post(`/`, async (req, res) => {
  const category = await Category.findById(req.body.category);

  if (!category) return res.status(400).send("Invalid Category");

  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: req.body.image,
    brand: req.body.brand,
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });

  product = await product.save();

  if (!product) return res.status(500).send("The product cannot be created");

  res.send(product);
});

//update product details
router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.body.id)) {
    res.status(400).send("Invalid Product Id");
  }
  const category = await Category.findById(req.body.category);

  if (!category) return res.status(400).send("Invalid Category");

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: req.body.image,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    //to get newly updated data, or else node will return old category details
    { new: true }
  );

  if (!product) return res.status(500).send("Product can not be updated!");

  res.send(product);
});

//delete product
router.delete("/:id", (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (product) {
        return res
          .status(200)
          .json({ success: true, message: "the product is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Product not found!" });
      }
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

//get the product count
router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments((count) => count)
  
    if (!productCount) {
      res.status(500).json({ success: false });
    }
  
    res.send({ productCount: productCount });
  });

  //get the featured products
router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0
    const products = await Product.find({ isFeatured: true }).limit(+count);
  
    if (!products) {
      res.status(500).json({ success: false });
    }
  
    res.send(products);
  });

module.exports = router;

