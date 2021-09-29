import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SharedDataService } from '../shared/services/sharedData.service'



@Component({
  selector: 'file-upload',
  templateUrl: "file-upload.component.html",
  styleUrls: ["file-upload.component.scss"]
})

export class FileUploadComponent {

	@Input()
	requiredFileType:string = '';

	@Output()
	metadataUpdateEvent = new EventEmitter<any>();

	@ViewChild('fileInput') private fileUpload!: ElementRef;

	fileName = '';
	uploadProgress:any = 0;
	uploadSub!: Subscription;
	isShowBusy: boolean = false;
	link!: string;
	uploadedFileName!: string;

	constructor(private http: HttpClient,
				private sharedData: SharedDataService) {}

	onFileSelected(event:any) {
		console.log('onFileSelected',event);
		const file:File = event.target.files[0];
	  	this.link = '';
		if (file) {
			this.fileName = file.name;
			const formData = new FormData();
			formData.append("thumbnail", file);

			const upload$ = this.http.post("/api/upload", formData, {
                reportProgress: true,
                observe: 'events'
            })
            .pipe(
                finalize(() => this.reset())
            );
          
            this.uploadSub = upload$.subscribe((event: any) => {
              if (event.type == HttpEventType.UploadProgress) {
                this.uploadProgress = Math.round(100 * (event.loaded / event.total));
              }
              if (event.type == HttpEventType.Response) {
				console.log('event', event);
				this.sharedData.setMetadata(event.body);
				this.metadataUpdateEvent.emit(event.body);
              }
            })

			// const upload$ = this.http.post("/api/upload", formData, {
			// 	responseType: 'json'
			// })
			// .pipe(
			// 	finalize(() => {
			// 		this.isShowBusy = false;
			// 		this.reset();
			// 	})
			// );

			// this.uploadSub = upload$.subscribe((data: any) => {
			// 	console.log('data', data);
			// 	this.sharedData.setMetadata(data);
			// 	this.metadataUpdateEvent.emit(data);
			// 	// this.reset();
			// 	// const blob = new Blob([data], {
			// 	// 	type: 'application/zip'
			//  // 	});
			// 	// const url = window.URL.createObjectURL(blob);
			// 	// this.link = url;
			// 	// window.open(url); 
			// })


		}
	}

  cancelUpload() {
	this.uploadSub.unsubscribe();
	this.reset();
  }

  reset() {
	this.uploadProgress = null;
	this.fileName = '';
	this.fileUpload.nativeElement.value = '';
	console.log('reset!');
  }

  // openLink() {
	 //  window.open(this.link); 
  // }
}