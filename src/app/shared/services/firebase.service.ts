import { inject, Injectable } from '@angular/core';
import { Firestore, collection, doc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  firestore: Firestore = inject(Firestore);

  constructor() {}

  getFirestoreCollectionDrivers() {
    return collection(this.firestore, 'drivers');
  }

  getFirestoreDrivers(collId: string, docId: string) {
    return doc(collection(this.firestore, collId), docId);
  }
}
