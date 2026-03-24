const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const APIError = require('../Errors/APIError');
const axios = require("axios")

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

exports.googleOAuth = async (code) => {
    // 1. Exchange code for tokens
    const { data } = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRIT,
        redirect_uri: process.env.GOOGLE_OAUTH_CALLBACK_URL,
        grant_type: 'authorization_code',
    });

    // 2. Get user info using the access_token
    const { data: profile } = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${data.access_token}`,
        { headers: { Authorization: `Bearer ${data.id_token}` } }
    );

    // 3. Find or Create user in your DB
    let user = await User.findOne({ email: profile.email });
    console.log("user row data from google: ", profile)
    if (!user) {
        user = await User.create({
            name: profile.name,
            email: profile.email,
            password: require('crypto').randomBytes(20).toString('hex'),
            authProvider: 'google',
            googleId: profile.id,
            profilePicture: {
                url: profile.picture,
            }
        });
    }

    // 4. Generate your app's JWT
    const token = generateToken(user._id);
    return { user, token };
};