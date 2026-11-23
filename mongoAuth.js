import { MongoClient } from 'mongodb';
import { initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys';

let cachedClient = null;
let cachedUri = null;

async function getCollection(mongoUri, collectionName = 'arthur_auth_state') {
  const uri = mongoUri || process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing.');
  }

  if (!cachedClient || cachedUri !== uri) {
    if (cachedClient) {
      await cachedClient.close().catch(() => {});
    }
    cachedClient = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
    });
    await cachedClient.connect();
    cachedUri = uri;
  }

  return cachedClient.db().collection(collectionName);
}

const serialize = (val) => JSON.parse(JSON.stringify(val, BufferJSON.replacer));
const deserialize = (val) => (val ? JSON.parse(JSON.stringify(val), BufferJSON.reviver) : null);

export async function useMongoDBAuthState(mongoUri, sessionId = 'arthur-session') {
  const collection = await getCollection(mongoUri);

  const readData = async (docId) => {
    const doc = await collection.findOne({ _id: `${sessionId}:${docId}` });
    return doc ? deserialize(doc.data) : null;
  };

  const writeData = async (docId, data) => {
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

  const removeData = async (docId) => {
    await collection.deleteOne({ _id: `${sessionId}:${docId}` });
  };

  let creds = await readData('creds');
  if (!creds) {
    const masterDoc = await readData('master_creds');
    if (masterDoc) {
      creds = masterDoc;
      await writeData('creds', creds);
    } else {
      creds = initAuthCreds();
      await writeData('creds', creds);
    }
  }

  const saveCreds = async () => {
    await writeData('creds', creds);
  };

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category of Object.keys(data || {})) {
            const entries = data[category];
            if (!entries) continue;
            for (const id of Object.keys(entries)) {
              const value = entries[id];
              const docId = `${category}-${id}`;
              if (value) {
                tasks.push(writeData(docId, value));
              } else {
                tasks.push(removeData(docId));
              }
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds,
    createMasterSnapshot: async () => {
      await writeData('master_creds', creds);
    },
    // Kept for backwards compatibility with older callers.
    // A pairing/re-authentication request must NEVER erase saved credentials.
    requestRePair: async () => {
      console.warn('[MongoDB Auth] Session data was preserved; no automatic deletion performed.');
      return false;
    },
    flush: async () => {
      await saveCreds();
    },
  };
}

export const useMongoAuthState = useMongoDBAuthState;