import { Component, OnInit, Input } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';


@Component({
  selector: 'file-upload',
  templateUrl: "file-upload.component.html",
  styleUrls: ["file-upload.component.scss"]
})

export class FileUploadComponent {

	@Input()
	requiredFileType:string = '';

	fileName = '';
	uploadProgress:any = 0;
	uploadSub: any;
	isShowBusy: boolean = false;
	link!: string;
	uploadedFileName!: string;

	constructor(private http: HttpClient) {}

	onFileSelected(event:any) {
		console.log('onFileSelected',event);
		const file:File = event.target.files[0];
	  	this.link = '';
		if (file) {
			this.fileName = file.name;
			const formData = new FormData();
			formData.append("thumbnail", file);
			this.isShowBusy = true;

			const upload$ = this.http.post("/api/upload", formData, {
				responseType: 'arraybuffer'
			})
			.pipe(
				finalize(() => {
					this.isShowBusy = false;
					this.reset();
				})
			);

			this.uploadSub = upload$.subscribe((data: any) => {
				console.log('data', data);
				this.reset();
				const blob = new Blob([data], {
					type: 'application/zip'
			 	});
				const url = window.URL.createObjectURL(blob);
				this.link = url;
				window.open(url); 
			})


		}
	}

  cancelUpload() {
	this.uploadSub.unsubscribe();
	this.reset();
  }

  reset() {
	this.uploadProgress = null;
	this.uploadSub = null;
  }

  openLink() {
	  window.open(this.link); 
  }
}