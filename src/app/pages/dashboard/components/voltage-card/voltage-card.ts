import { Component, Input } from '@angular/core';
export interface VoltageCard { label:string; value:string; unit:string; icon:string; foot:string; tone:'green'|'blue'|'active'|'red'|'warning'; badge?:string; }
@Component({ selector:'app-voltage-card', standalone:true, templateUrl:'./voltage-card.html', styleUrl:'./voltage-card.css' })
export class VoltageCardComponent { @Input({required:true}) data!: VoltageCard; }
