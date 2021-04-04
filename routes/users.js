const {User} = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

router.get(`/`, async (req, res) =>{
    //passwordHash is excluded from returning JSON for security purposes 
    const userList = await User.find().select('-passwordHash');
    //const userList = await User.find().select('name email phone');

    if(!userList) {
        res.status(500).json({success: false})
    } 
    res.send(userList);
})

//Register User
router.post('/', async (req, res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    })
    user = await user.save();

    if(!user)
    return res.status(404).send('user can not be created!');

    res.send(user);
})

//get user by id
router.get('/:id', async(req, res) => {
    //passwordHash is excluded from returning JSON
    const user = await User.findById(req.params.id).select('-passwordHash');

    if(!user) {
        res.status(500).json({ message: 'The user with the given ID was not found!'})
    }
    res.status(200).send(user);
})

//user login function 
router.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email })

    if(!user) {
        return res.status(400).send('The User not found!')
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash))
    {
        res.status(200).send('User Authenticated');
    } else {
        res.status(400).send('password is wrong!');
    }

    return res.status(200).send(user);
})

module.exports =router;