
const { connectRabbitMQ } = require('../Config/rabbitmq');
const { startEmailWorker } = require('./emailWorker');

//Main function to start the worker
const main = async () => {
    try {
        console.log('🚀 Starting Email Worker Service...');
        
        await connectRabbitMQ();
        
        await startEmailWorker();
        
        console.log('✅ Email Worker Service is running');
        
    } catch (error) {
        console.error('❌ Failed to start Email Worker Service:', error);
        process.exit(1);
    }
};

main();