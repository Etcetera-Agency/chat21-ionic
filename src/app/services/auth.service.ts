import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})

export abstract class AuthService {

  // BehaviorSubject
  abstract authStateChanged: BehaviorSubject<any> = new BehaviorSubject<any>([]);

  // params
  abstract persistence = environment.authPersistence;
  abstract SERVER_BASE_URL = environment.SERVER_BASE_URL;

  // functions
  abstract initialize(tenant: string): void;
  abstract getUser(): any;
  abstract getToken(): string;
  abstract getTiledeskToken(): string;
  abstract signInWithEmailAndPassword(email: string, password: string): void;

}
