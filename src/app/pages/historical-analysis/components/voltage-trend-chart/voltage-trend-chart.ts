import { Component, Input } from '@angular/core';

@Component({selector:'app-voltage-trend-chart',standalone:true,templateUrl:'./voltage-trend-chart.html',styleUrl:'./voltage-trend-chart.css'})
export class VoltageTrendChart {
  @Input() subtitle = '24-hour voltage readings · All active sections';
  readonly points = [
    { x:55,y:92,time:'00:00',value:'5.1 kV' }, { x:245,y:50,time:'04:00',value:'6.3 kV' },
    { x:435,y:48,time:'08:00',value:'6.4 kV' }, { x:625,y:78,time:'12:00',value:'5.5 kV' },
    { x:815,y:116,time:'16:00',value:'4.2 kV' }, { x:1005,y:92,time:'20:00',value:'5.0 kV' },
    { x:1145,y:79,time:'24:00',value:'5.4 kV' },
  ];
}
