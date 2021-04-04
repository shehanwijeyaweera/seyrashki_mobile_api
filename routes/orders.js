const { Order } = require("../models/order");
const express = require("express");
const { OrderItem } = require("../models/order-item");
const router = express.Router();

//get all orders
router.get(`/`, async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "name")
    .sort({ dateOrdered: -1 }); //sort the results from newst to oldest

  if (!orderList) {
    res.status(500).json({ success: false });
  }
  res.send(orderList);
});

//get order details
router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    });

  if (!order) {
    res.status(500).json({ success: false });
  }
  res.send(order);
});

//create a new order
router.post("/", async (req, res) => {
  //saving new order items in the database
  const orderItemsIds = Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });

      newOrderItem = await newOrderItem.save();

      return newOrderItem._id;
    })
  );
  //waits until the promise returns product ids
  const orderItemsIdsResolved = await orderItemsIds;

  //getting total price of each product
  const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) =>{
      const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
      const totalPrice = orderItem.product.price * orderItem.quantity;
      return totalPrice
  }))

  //getting total price of all of the products
  const totalPrice = totalPrices.reduce((a,b) => a + b , 0);

  let order = new Order({
    orderItems: orderItemsIdsResolved,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrice,
    user: req.body.user,
  });
  order = await order.save();

  if (!order) return res.status(404).send("Order can not be placed!");

  res.send(order);
});

//update order status
router.put('/:id', async (req, res)=> {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status,
        },
        //to get newly updated data, or else node will return old category details
        { new: true }
    )
    
    if(!order)
    return res.status(404).send('status can not be updated!');

    res.send(order);
})

//delete order
router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async order => {
        if(order) {
            //deleting order items when deleting order 
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })

            return res.status(200).json({ success: true, message: 'the order is deleted!'})
        } else {
            return res.status(404).json({ success: false, message: 'order not found!'})
        }
    }).catch((err) => {
        return res.status(400).json({ success: false, error: err})
    })
})

module.exports = router;
