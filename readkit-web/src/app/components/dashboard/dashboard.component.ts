import { Component, OnInit, NgZone } from '@angular/core';
import { AuthService } from "../../shared/services/auth.service";
import { Router } from "@angular/router";


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(
    public authService: AuthService,
    public router: Router,
    public ngZone: NgZone
  ) { }

  ngOnInit() {
  	console.log("this.authService.isLoggedIn", this.authService.isLoggedIn);
  	const user = JSON.parse(localStorage.getItem('user')!);
  	if(!user || user === null) {
  		this.router.navigate(['sign-in']);
  	}
  }

}