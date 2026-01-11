// src/storage/assetsDb.ts
import { openDB } from 'idb'

const DB_NAME = 'editor-assets'
const STORE = 'assets'
const DB_VERSION = 1

export type StoredAsset = {
  id: string
  blob: Blob
  mime: string
  createdAt: number
}

async function db() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: 'id' })
      }
    },
  })
}

export async function putAsset(asset: StoredAsset) {
  const d = await db()
  await d.put(STORE, asset)
}

export async function getAsset(id: string): Promise<StoredAsset | undefined> {
  const d = await db()
  return d.get(STORE, id)
}

export async function deleteAsset(id: string) {
  const d = await db()
  await d.delete(STORE, id)
}
