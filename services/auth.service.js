const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const APIError = require('../Errors/APIError');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

exports.registerUser = async (userData) => {
    const { email, password, name } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new APIError('User already exists', 400);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashedPassword
    });

    const userObj = user.toObject();
    delete userObj.password;

    const token = generateToken(user._id);
    return { user: userObj, token };
};

exports.loginUser = async (email, password) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new APIError('User not found', 403);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new APIError('Invalid password', 401);

    const userObj = user.toObject();
    delete userObj.password;

    const token = generateToken(user._id);
    return { user: userObj, token };
};