import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';


// models
import { UploadModel } from '../../models/upload';

@Injectable({
  providedIn: 'root'
})

export abstract class UploadService {

  //params
  private DEFAULT_URL: string = environment.apiUrl;
  private baseUrl;

  public setBaseUrl(baseUrl): void {
    this.baseUrl = baseUrl;
  }
  public getBaseUrl(): string {
    if (this.baseUrl) {
      return this.baseUrl;
    } else {
      return this.DEFAULT_URL;
    }
  }

  //BehaviorSubject
  abstract BSStateUpload: BehaviorSubject<any>;

  // params
  // abstract tenant = environment.tenant;

  // functions
  abstract initialize(): void;
  abstract upload(userId: string, upload: UploadModel): Promise<any>;
}