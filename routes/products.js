const { Product } = require("../models/product");
const express = require("express");
const { Category } = require("../models/category");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer"); //handle server side uploads

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads"); //uploading file location
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-"); // replacing file name spaces with dash
    const extention = FILE_TYPE_MAP[file.mimetype]; //returns the file type extention
    cb(null, `${fileName}-${Date.now()}.${extention}`); // file name format : filename-uploadedDateTime.jpg
  },
});

const uploadOptions = multer({ storage: storage });

//get all products
router.get(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
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
router.post(`/`, uploadOptions.single("image"), async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");

  const file = req.file;
  if(!file) return res.status(400).send('No image in the request');

  const fileName = req.file.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`; // protocol - to gett http part and host part returns the current host path

  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${fileName}`, //http://localhost:3000/public/upload/imagename-dateTile.jpeg
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
router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.body.id)) {
    res.status(400).send("Invalid Product Id");
  }

  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");

  const product = await Product.findById(req.params.id); // before updating the image, getting the current product details in db
  if(!product) return res.status(400).send('Invalid Product!');

  const file = req.file;
  let imagepath;

  if(file){
    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`; // protocol - to get http part and host part returns the current host path
    imagepath = `${basePath}${fileName}`;
  } else {
    imagepath = product.image; //if user not sending an image, image will be set to old image location
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: imagepath,
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

  if (!updatedProduct) return res.status(500).send("Product can not be updated!");

  res.send(updatedProduct);
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
  const productCount = await Product.countDocuments((count) => count);

  if (!productCount) {
    res.status(500).json({ success: false });
  }

  res.send({ productCount: productCount });
});

//get the featured products
router.get(`/get/featured/:count`, async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const products = await Product.find({ isFeatured: true }).limit(+count);

  if (!products) {
    res.status(500).json({ success: false });
  }

  res.send(products);
});

//upload multipal images
router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send('Invalid Product Id');
  }
  const files = req.files;
  let imagesPaths = [];
  const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

  if (files) {
      files.map((file) => {
          imagesPaths.push(`${basePath}${file.filename}`);
      });
  }

  const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
          images: imagesPaths
      },
      { new: true }
  );

  console.log(product);

  if (!product) return res.status(500).send('the gallery cannot be updated!');

  res.send(product);
});

module.exports = router;
