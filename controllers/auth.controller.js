const APIError = require('../Errors/APIError');
const authService = require('../services/auth.service');

const signup = async (req, res) => {
    try {
        const { user, token } = await authService.registerUser(req.body);
        res.status(201).json({ user, token });
    } catch (error) {
        console.log(error)
        throw new APIError("Invalid credentials", 400);
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.loginUser(email, password);
        res.status(200).json({ user, token });
    } catch (error) {
        console.log(error)
        throw new APIError("Invalid credentials", 401);
    }
};

const googleAuth = async (req, res) => {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
        redirect_uri: process.env.GOOGLE_OAUTH_CALLBACK_URL,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ].join(' '),
    };

    const qs = new URLSearchParams(options);
    res.redirect(`${rootUrl}?${qs.toString()}`);
};


const googleCallback = async (req, res, next) => {
    const code = req.query.code;
    try {
        const { user, token } = await authService.googleOAuth(code);
        console.log("user data form google is : ", user)
        res.status(200).json({
            success: true,
            message: "Google Login Successful",
            user,
            token
        });
    } catch (error) {
        console.log("error oauth is ", error)
        next(error);
    }
};

module.exports = {
    signup,
    login,
    googleAuth,
    googleCallback,
}