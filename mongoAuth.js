import { MongoClient } from 'mongodb';
import { initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys';

let clientPromise = null;

async function getAuthCollection(options = {}) {
  const uri = options.mongoUri || process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing. Please configure it in environment variables or GitHub Secrets.');
  }

  if (!clientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
    });
    clientPromise = client.connect();
  }

  const connectedClient = await clientPromise;
  const dbName = options.dbName;
  const db = dbName ? connectedClient.db(dbName) : connectedClient.db();
  const collectionName = options.collectionName || 'arthur_auth_state';

  return db.collection(collectionName);
}

const serialize = (value) => JSON.parse(JSON.stringify(value, BufferJSON.replacer));

const deserialize = (value) => {
  if (!value) return null;
  return JSON.parse(JSON.stringify(value), BufferJSON.reviver);
};

/**
 * مخزن جلسة Baileys مباشر في قاعدة بيانات MongoDB
 * @param {string} [sessionId='arthur_main']
 * @param {object} [options]
 */
export async function useMongoAuthState(sessionId = 'arthur_main', options = {}) {
  const collection = await getAuthCollection(options);

  const readDoc = async (docId) => {
    const doc = await collection.findOne({ _id: `${sessionId}:${docId}` });
    return doc ? deserialize(doc.data) : null;
  };

  const writeDoc = async (docId, data) => {
    await collection.updateOne(
      { _id: `${sessionId}:${docId}` },
      {
        $set: {
          sessionId,
          docId,
          data: serialize(data),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  };

  const deleteDoc = async (docId) => {
    await collection.deleteOne({ _id: `${sessionId}:${docId}` });
  };

  const existingCreds = await readDoc('creds');
  const creds = existingCreds || initAuthCreds();
  if (!existingCreds) {
    await writeDoc('creds', creds);
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const result = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readDoc(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              result[id] = value;
            })
          );
          return result;
        },
        set: async (data) => {
          const ops = [];
          for (const category of Object.keys(data || {})) {
            const entries = data[category];
            if (!entries) continue;

            for (const id of Object.keys(entries)) {
              const value = entries[id];
              const docId = `${category}-${id}`;
              if (value) {
                ops.push(writeDoc(docId, value));
              } else {
                ops.push(deleteDoc(docId));
              }
            }
          }
          await Promise.all(ops);
        },
      },
    },
    saveCreds: async () => {
      await writeDoc('creds', creds);
    },
  };
}

export async function clearMongoAuthState(sessionId = 'arthur_main', options = {}) {
  const collection = await getAuthCollection(options);
  await collection.deleteMany({ sessionId });
}
