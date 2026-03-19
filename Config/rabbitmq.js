const amqp = require('amqplib');

let connection = null;
let channel = null;


//Connect to RabbitMQ

const connectRabbitMQ = async () => {
    try {
        // Create connection to RabbitMQ server
        connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
        
        // Create a channel (like a virtual connection within the connection)
        channel = await connection.createChannel();
        
        // Declare the queue (creates it if it doesn't exist)
        // durable: true means the queue survives RabbitMQ restarts
        await channel.assertQueue(process.env.EMAIL_QUEUE_NAME || 'email_queue', {
            durable: true
        });
        
        console.log('✅ Connected to RabbitMQ');
        
        // Handle connection errors
        connection.on('error', (err) => {
            console.error('❌ RabbitMQ connection error:', err);
        });
        
        connection.on('close', () => {
            console.log('⚠️  RabbitMQ connection closed');
        });
        
        return channel;
    } catch (error) {
        console.error('❌ Failed to connect to RabbitMQ:', error);
        throw error;
    }
};

//Get the channel (creates one if it doesn't exist)

const getChannel = async () => {
    if (!channel) {
        await connectRabbitMQ();
    }
    return channel;
};

//Publish a message to the queue

const publishToQueue = async (queueName, message) => {
    try {
        const ch = await getChannel();
        
        
        const messageBuffer = Buffer.from(JSON.stringify(message));
        
        
        ch.sendToQueue(queueName, messageBuffer, {
            persistent: true
        });
        
        console.log(`📤 Message published to queue: ${queueName}`);
    } catch (error) {
        console.error('❌ Failed to publish message:', error);
        throw error;
    }
};

//Close RabbitMQ connection

const closeConnection = async () => {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
        console.log('✅ RabbitMQ connection closed');
    } catch (error) {
        console.error('❌ Error closing RabbitMQ connection:', error);
    }
};

module.exports = {
    connectRabbitMQ,
    getChannel,
    publishToQueue,
    closeConnection
};