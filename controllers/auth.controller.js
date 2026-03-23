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

module.exports = {
    signup,
    login
}