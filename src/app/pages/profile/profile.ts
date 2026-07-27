import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

interface Profile { firstName:string; lastName:string; email:string; phone:string; employeeId:string; department:string; location:string; bio:string; }
@Component({selector:'app-profile-page',standalone:true,imports:[FormsModule,RouterLink,HeaderComponent,SidebarComponent],templateUrl:'./profile.html',styleUrl:'./profile.css'})
export class ProfilePage {
  editing=false; saved=false;
  profileImage: string | null = null;
  imageError = '';
  profile:Profile={firstName:'Suresh',lastName:'Ambegoda',email:'suresh.ambegoda@dwc.gov.lk',phone:'+94 77 245 8190',employeeId:'DWC-ADM-001',department:'Wildlife Operations & Technology',location:'Department of Wildlife Conservation, Colombo',bio:'System administrator responsible for the remote electric-fence monitoring platform and field infrastructure operations.'};
  draft={...this.profile};
  startEdit(){this.draft={...this.profile};this.editing=true;this.saved=false}
  cancel(){this.draft={...this.profile};this.editing=false}
  save(){if(!this.draft.firstName.trim()||!this.draft.lastName.trim()||!this.draft.email.trim())return;this.profile={...this.draft};this.editing=false;this.saved=true;setTimeout(()=>this.saved=false,3000)}
  uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.imageError = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.imageError = 'Choose a valid image file.'; input.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { this.imageError = 'Profile images must be smaller than 5 MB.'; input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => { this.profileImage = String(reader.result); };
    reader.readAsDataURL(file);
    input.value = '';
  }
  removeImage(): void { this.profileImage = null; this.imageError = ''; }
}
