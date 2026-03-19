
module.exports = {
    createUserSchema: require("./createUserSchems"),
    logInSchema: require("./LogIn"),
    UpdateUserSchema: require("./updateUserSchema"),
    GetAllUsersSchema: require("./getAllUsersSchema"),
    forgotPasswordSchema: require("./forgotPasswordSchema"),
    verifyOTPSchema: require("./verifyOTPSchema"),
    resetPasswordSchema: require("./resetPasswordSchema"),
    changePasswordSchema: require("./changePasswordSchema"),
    searchUsersSchema: require("./searchUsersSchema")
}