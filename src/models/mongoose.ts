import mongoose from 'mongoose';
import config from 'config';

mongoose.Promise = global.Promise;

// Get the MongoDB URI from config (make sure you have typings if needed)
const mongoUri: string = config.get<string>('mongoUri');

mongoose.connect(mongoUri);

const conn = mongoose.connection;

conn.on('error', () => console.log('Connection error'));
conn.on('open', () => console.log('Connected to MongoDB'));

export default conn;
