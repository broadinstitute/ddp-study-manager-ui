import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-participant-update-result-dialog',
  templateUrl: './participant-update-result-dialog.component.html',
  styleUrls: ['./participant-update-result-dialog.component.css']
})
export class ParticipantUpdateResultDialogComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: {message: string}) { }

  ngOnInit() {
  }

}
