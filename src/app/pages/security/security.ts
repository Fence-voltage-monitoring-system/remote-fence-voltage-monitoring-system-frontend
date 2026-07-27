import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
@Component({selector:'app-security-page',standalone:true,imports:[FormsModule,RouterLink,HeaderComponent,SidebarComponent],templateUrl:'./security.html',styleUrl:'./security.css'})
export class SecurityPage {
  twoFactorEnabled=true;passwordOpen=false;submitted=false;message='';currentPassword='';newPassword='';confirmPassword='';
  sessions=[{device:'Windows PC',browser:'Chrome 138',location:'Colombo, Sri Lanka',ip:'192.168.1.24',lastActive:'Active now',current:true},{device:'Android phone',browser:'Chrome Mobile',location:'Colombo, Sri Lanka',ip:'192.168.1.46',lastActive:'2 hours ago',current:false}];
  readonly activity=[{action:'Successful sign-in',time:'Today, 15:28',location:'Colombo · 192.168.1.24',result:'success'},{action:'Two-factor verification',time:'Today, 15:28',location:'Authenticator application',result:'success'},{action:'Failed sign-in attempt',time:'26 Jul 2026, 21:14',location:'Unknown · 103.125.18.44',result:'failed'},{action:'Password changed',time:'03 Jul 2026, 10:42',location:'Colombo · 192.168.1.24',result:'success'}];
  notify(text:string){this.message=text;setTimeout(()=>this.message='',3000)}
  toggleTwoFactor(){this.twoFactorEnabled=!this.twoFactorEnabled;this.notify(`Two-factor authentication ${this.twoFactorEnabled?'enabled':'disabled'}.`)}
  changePassword(){this.submitted=true;if(!this.currentPassword||this.newPassword.length<8||this.newPassword!==this.confirmPassword)return;this.passwordOpen=false;this.submitted=false;this.currentPassword='';this.newPassword='';this.confirmPassword='';this.notify('Password updated successfully.')}
  revokeSession(index:number){this.sessions.splice(index,1);this.notify('Session signed out successfully.')}
}
