import { NextResponse } from 'next/server';
import { admin } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const firestore = admin.firestore();
    const videosCollection = firestore.collection('videos');
    const snapshot = await videosCollection.get();
    const videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Failed to fetch video library:', error);
    return NextResponse.json({ error: 'Failed to fetch video library' }, { status: 500 });
  }
}
