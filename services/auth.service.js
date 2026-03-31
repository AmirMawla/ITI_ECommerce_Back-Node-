const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const APIError = require('../Errors/APIError');
const axios = require("axios");
const emailService = require('../services/email.service');

const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
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

    try {
        await emailService.sendWelcomeEmail(user);
    } catch (emailError) {
        console.error('📧 Email Service Error:', emailError.message);
    }

    const userObj = user.toObject();
    delete userObj.password;

    const token = generateToken(user._id, user.role);
    return { user: userObj, token };
};

exports.loginUser = async (email, password) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new APIError('User not found', 404);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new APIError('Invalid password', 401);

    const userObj = user.toObject();
    delete userObj.password;

    const token = generateToken(user._id, user.role);
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

        try {
            await emailService.sendWelcomeEmail(user);
        } catch (e) {
            console.error('📧 Google Signup Email Error:', e.message);
        }
    }

    // 4. Generate your app's JWT
    const token = generateToken(user._id, user.role);
    return { user, token };
};

exports.forgotPassword = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new APIError('User with this email does not exist', 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOTP = otp;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    user.otpVerified = false;
    await user.save();

    // Updated to use your RabbitMQ function
    await emailService.sendPasswordResetOTP(user, otp);

    return { message: 'OTP sent to email' };
};

exports.verifyOTP = async (email, otp) => {
    const user = await User.findOne({ email });
    if (!user) throw new APIError('User not found', 404);

    if (user.isOTPExpired() || user.passwordResetOTP !== otp) {
        throw new APIError('Invalid or expired OTP', 400);
    }

    user.otpVerified = true;
    await user.save();

    return { message: 'OTP verified successfully' };
};

exports.resetPassword = async (email, newPassword) => {
    const user = await User.findOne({ email });
    if (!user) throw new APIError('User not found', 404);

    if (!user.otpVerified) {
        throw new APIError('OTP not verified', 400);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetOTP = null;
    user.passwordResetExpires = null;
    user.otpVerified = false;
    await user.save();

    // Send confirmation email via RabbitMQ
    await emailService.sendPasswordResetConfirmation(user);

    return { message: 'Password reset successful' };
};

exports.changePassword = async (userId, oldPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new APIError('User not found', 404);

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) throw new APIError('Current password is incorrect', 401);

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { message: 'Password updated successfully' };
};