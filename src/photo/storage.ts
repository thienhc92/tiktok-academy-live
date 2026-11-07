export const PHOTO_LIMIT = 20 * 1024 * 1024;
export async function validatePhoto(file: Blob): Promise<boolean> {
    if (!file.size || file.size > PHOTO_LIMIT) return false;
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const jpeg = file.type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const png = file.type === 'image/png' && [137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b);
    const webp = file.type === 'image/webp' && String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
    return jpeg || png || webp;
}
/** Separate database: never reads or writes Academy/LIVE progress. */
function database(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('chua-online-photo-v1', 1);
        let blocked = false;
        request.onupgradeneeded = () => request.result.createObjectStore('photos');
        request.onsuccess = () => { if (blocked) request.result.close(); else resolve(request.result); };
        request.onerror = () => reject(request.error);
        request.onblocked = () => { blocked = true; reject(new Error('photo database blocked')); };
    });
}
export async function readPhoto(): Promise<Blob | null> {
    const db = await database();
    try {
        return await new Promise((resolve, reject) => {
            const tx = db.transaction('photos', 'readonly');
            const request = tx.objectStore('photos').get('current');
            tx.oncomplete = () => resolve(request.result instanceof Blob ? request.result : null);
            tx.onerror = tx.onabort = () => reject(tx.error);
        });
    } finally { db.close(); }
}
export async function savePhoto(photo: Blob): Promise<void> {
    const db = await database();
    try {
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('photos', 'readwrite');
            tx.objectStore('photos').put(photo, 'current');
            tx.oncomplete = () => resolve();
            tx.onerror = tx.onabort = () => reject(tx.error);
        });
    } finally { db.close(); }
}
