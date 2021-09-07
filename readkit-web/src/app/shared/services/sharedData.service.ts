import { Injectable, NgZone } from '@angular/core';
import { User } from "../services/user";
import auth from 'firebase/app';
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {

  private metadata: any; 

  constructor(
    public afs: AngularFirestore,   // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,  
    public ngZone: NgZone // NgZone service to remove outside scope warning
  ) {
  }

  public setMetadata(metadata: any) {
    this.metadata = metadata;
  }

  public getMetadata(): any {
    return this.metadata;
  }

}