const { publishToQueue } = require('../Config/rabbitmq');

const EMAIL_QUEUE = process.env.EMAIL_QUEUE_NAME || 'email_queue';

//Email Types - used to identify which template to use
const EMAIL_TYPES = {
    WELCOME: 'welcome',
    PASSWORD_RESET: 'passwordReset',
    PASSWORD_RESET_CONFIRMATION: 'passwordResetConfirmation'
};

//Send welcome email after user registration
const sendWelcomeEmail = async (user) => {
    const emailData = {
        type: EMAIL_TYPES.WELCOME,
        to: user.email,
        subject: 'Welcome to Our AURA Platform! 🎉',
        data: {
            userName: user.name,
            loginUrl: `${process.env.FRONTEND_URL}/login`
        }
    };

    await publishToQueue(EMAIL_QUEUE, emailData);
    console.log(`📧 Welcome email queued for ${user.email}`);
};


//Send password reset OTP email
const sendPasswordResetOTP = async (user, otp) => {
    const emailData = {
        type: EMAIL_TYPES.PASSWORD_RESET,
        to: user.email,
        subject: 'Your Password Reset OTP',
        data: {
            userName: user.name,
            otp,
            expiryTime: '10 minutes'
        }
    };

    await publishToQueue(EMAIL_QUEUE, emailData);
    console.log(`📧 Password reset OTP email queued for ${user.email}`);
};


//Send password reset confirmation
const sendPasswordResetConfirmation = async (user) => {
    const emailData = {
        type: EMAIL_TYPES.PASSWORD_RESET_CONFIRMATION,
        to: user.email,
        subject: 'Your Password Has Been Reset',
        data: {
            userName: user.name,
            loginUrl: `${process.env.FRONTEND_URL}/login`,
            timestamp: new Date().toLocaleString()
        }
    };

    await publishToQueue(EMAIL_QUEUE, emailData);
    console.log(`📧 Password reset confirmation queued for ${user.email}`);
};




module.exports = {
    EMAIL_TYPES,
    sendWelcomeEmail,
    sendPasswordResetOTP,
    sendPasswordResetConfirmation
};