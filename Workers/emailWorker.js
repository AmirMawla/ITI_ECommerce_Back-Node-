const { getChannel } = require('../Config/rabbitmq');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
require('dotenv').config();

const EMAIL_QUEUE = process.env.EMAIL_QUEUE_NAME || 'email_queue';

//Create Nodemailer transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false, 
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        logger: process.env.NODE_ENV === 'development',
        debug: process.env.NODE_ENV === 'development'
    });
};

//Load and compile email template
const loadTemplate = (templateName, data) => {
    try {
        const templatePath = path.join(__dirname, '../Templetes/Emails', `${templateName}.html`);
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        
        const template = handlebars.compile(templateSource);
        
        return template(data);
    } catch (error) {
        console.error(`❌ Failed to load template ${templateName}:`, error);
        throw error;
    }
};

//Send email using Nodemailer
const sendEmail = async (emailData) => {
    const { type, to, subject, data } = emailData;
    
    try {
        const html = loadTemplate(type, data);
        
        const transporter = createTransporter();
        
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: to,
            subject: subject,
            html: html
        });
        
        console.log(`✅ Email sent successfully to ${to}`);
        console.log(`   Type: ${type}`);
        console.log(`   Message ID: ${info.messageId}`);
        
        return info;
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
        throw error;
    }
};

//Start the email worker
const startEmailWorker = async () => {
    try {
        console.log('🔄 Starting Email Worker...');
        
        const channel = await getChannel();
        
        await channel.prefetch(1);
        
        console.log(`✅ Email Worker started, listening to queue: ${EMAIL_QUEUE}`);
        console.log('⏳ Waiting for email jobs...');
        
        channel.consume(EMAIL_QUEUE, async (msg) => {
            if (msg !== null) {
                try {
                    const emailData = JSON.parse(msg.content.toString());
                    
                    console.log(`📬 Received email job: ${emailData.type} to ${emailData.to}`);
                    
                    await sendEmail(emailData);
                    
                    channel.ack(msg);
                    console.log('✅ Job completed and acknowledged');
                    
                } catch (error) {
                    console.error('❌ Error processing email job:', error);
                    
                    channel.nack(msg, false, true);
                    console.log('⚠️  Job rejected and requeued for retry');
                }
            }
        }, {
            noAck: false 
        });
        
    } catch (error) {
        console.error('❌ Failed to start email worker:', error);
        process.exit(1);
    }
};

//Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⚠️  Shutting down email worker...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⚠️  Shutting down email worker...');
    process.exit(0);
});

module.exports = { startEmailWorker };