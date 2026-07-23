import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({ selector:'app-section-toolbar', standalone:true, imports:[FormsModule], templateUrl:'./section-toolbar.html', styleUrl:'./section-toolbar.css' })
export class SectionToolbar { @Input() search=''; @Input() status=''; @Output() searchChange=new EventEmitter<string>(); @Output() statusChange=new EventEmitter<string>(); @Output() bulkAdd=new EventEmitter<void>(); @Output() register=new EventEmitter<void>(); }
