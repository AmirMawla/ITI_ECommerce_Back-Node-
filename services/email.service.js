const { publishToQueue } = require('../Config/rabbitmq');

const EMAIL_QUEUE = process.env.EMAIL_QUEUE_NAME || 'email_queue';

//Email Types - used to identify which template to use
const EMAIL_TYPES = {
    WELCOME: 'welcome',
    PASSWORD_RESET: 'passwordReset',
    PASSWORD_RESET_CONFIRMATION: 'passwordResetConfirmation',
    RESTRICTION_STATUS: 'restrictionStatus',
    SELLER_DECISION: 'sellerDecision',
    PASSWORD_RESET_CONFIRMATION: 'passwordResetConfirmation',
    ORDER_STATUS_CHANGED: 'orderStatusChanged',
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

const sendSellerDecisionEmail = async (user, isApproved) => {
    const emailData = {
        type: EMAIL_TYPES.SELLER_DECISION,
        to: user.email,
        subject: isApproved ? 'Congratulations! Your Seller Account is Active 🚀' : 'Update on Your Seller Application',
        data: {
            userName: user.name,
            isApproved,
            message: isApproved
                ? 'Your application to become a seller has been approved. You can now start listing products!'
                : 'Unfortunately, your seller application was not approved at this time.',
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/seller`
        }
    };

    await publishToQueue(EMAIL_QUEUE, emailData);
    console.log(`📧 Seller decision (${isApproved ? 'Approved' : 'Rejected'}) queued for ${user.email}`);
};

const sendRestrictionNotification = async (user, isRestricted) => {
    const status = isRestricted ? 'Restricted' : 'Restored';
    const emailData = {
        type: EMAIL_TYPES.RESTRICTION_STATUS,
        to: user.email,
        subject: `Your Account Status Has Been ${status}`,
        data: {
            userName: user.name,
            status: status.toLowerCase(),
            message: isRestricted
                ? 'Your account has been restricted due to a violation of our terms.'
                : 'Great news! Your account access has been fully restored.',
            timestamp: new Date().toLocaleString()
        }
    };

    await publishToQueue(EMAIL_QUEUE, emailData);
    console.log(`📧 Restriction notification (${status}) queued for ${user.email}`);
};

module.exports = {
    EMAIL_TYPES,
    sendWelcomeEmail,
    sendPasswordResetOTP,
    sendPasswordResetConfirmation,
    sendRestrictionNotification,
    sendSellerDecisionEmail,
    sendPasswordResetConfirmation,
    sendOrderStatusChangedEmail: async ({ to, subject, data }) => {
        const emailData = {
            type: EMAIL_TYPES.ORDER_STATUS_CHANGED,
            to,
            subject: subject || 'Order status updated',
            data: data || {},
        };
        await publishToQueue(EMAIL_QUEUE, emailData);
        console.log(`📧 Order status email queued for ${to}`);
    }
};