import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers,  // ← DIE FIREBASE CONFIG
    provideAnimations(), 
    provideHttpClient(), provideFirebaseApp(() => initializeApp({ projectId: "overtakef1-ff193", appId: "1:389941721107:web:087c513a66e68aadea67e6", storageBucket: "overtakef1-ff193.firebasestorage.app", apiKey: "AIzaSyDNtZR9OCv2EBsI69T8htYzuvmJ21rQDug", authDomain: "overtakef1-ff193.firebaseapp.com", messagingSenderId: "389941721107", measurementId: "G-E2TERET8VS" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())
  ]
});