import { Component, OnInit, Inject } from '@angular/core';
import { MD_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-participant-update-result-dialog',
  templateUrl: './participant-update-result-dialog.component.html',
  styleUrls: ['./participant-update-result-dialog.component.css']
})
export class ParticipantUpdateResultDialogComponent implements OnInit {

  constructor(@Inject(MD_DIALOG_DATA) public data: {message: string}) { }

  ngOnInit() {
  }

}
