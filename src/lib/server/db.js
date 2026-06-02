import { MongoClient, ObjectId } from 'mongodb';
import { MONGO_URI } from '$env/static/private';

// Single shared MongoClient across the app (connection pooling).
let clientPromise;

function getClient() {
	if (!clientPromise) {
		const client = new MongoClient(MONGO_URI, { maxPoolSize: 5 });
		clientPromise = client.connect();
	}
	return clientPromise;
}

export async function db() {
	const client = await getClient();
	return client.db('wdi');
}

// Collections helper
export async function collections() {
	const database = await db();
	return {
		clients: database.collection('clients'),
		products: database.collection('products'),
		whitelists: database.collection('whitelists'),
		verifications: database.collection('verifications')
	};
}

export { ObjectId };
