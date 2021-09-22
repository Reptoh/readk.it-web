import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { AuthService } from "../../shared/services/auth.service";
import { Router } from "@angular/router";
import { MatStepper } from '@angular/material/stepper';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {FormBuilder, FormGroup, Validators} from '@angular/forms';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

	@ViewChild('stepper') private myStepper!: MatStepper;

	metaData: any;
	isShowBusy: boolean = false;
	link!: string | null;
	convertSub: any;

  constructor(
    public authService: AuthService,
    public router: Router,
    public ngZone: NgZone,
    private http: HttpClient,
    private _formBuilder: FormBuilder
  ) { }

  ngOnInit() {
  	console.log("this.authService.isLoggedIn", this.authService.isLoggedIn);
  	const user = JSON.parse(localStorage.getItem('user')!);
  	if(!user || user === null) {
  		this.router.navigate(['sign-in']);
  	}

  }

  setMeta(meta:any) {
  	this.metaData = meta;
  	this.myStepper.next();
  }

  openLink() {
  	if(this.link) {
	  window.open(this.link); 
  	}
  }

  convert() {
  	this.myStepper.next();
  	this.isShowBusy = true;
  	const convert$ = this.http.post("/api/convert", new FormData(), {
		responseType: 'arraybuffer'
			})
			.pipe(
				finalize(() => {
					this.isShowBusy = false;
					// this.reset();
				})
			);

			this.convertSub = convert$.subscribe((data: any) => {
				console.log('convert data', data);
				// this.reset();
				const blob = new Blob([data], {
					type: 'application/zip'
			 	});
				const url = window.URL.createObjectURL(blob);
				this.link = url;
				window.open(url); 
			})
  }

  cancelUpload() {
	this.convertSub.unsubscribe();
	this.reset();
  }

  back() {
  	this.reset();
  }

  reset() {
  	this.link = null;
	this.convertSub = null;
	this.myStepper.previous();
	const reset$ = this.http.post("/api/reset", {
		responseType: 'json'
	})
	.pipe(
		finalize(() => {})
	);

	const resetSub = reset$.subscribe((data: any) => {
		console.log('data', data);
	})
  }

}