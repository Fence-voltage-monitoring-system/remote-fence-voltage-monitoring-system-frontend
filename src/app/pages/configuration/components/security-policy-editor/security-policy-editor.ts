import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SecurityPolicySettings } from '../../configuration.models';

@Component({selector:'app-security-policy-editor',standalone:true,imports:[FormsModule],templateUrl:'./security-policy-editor.html',styleUrl:'./security-policy-editor.css'})
export class SecurityPolicyEditor {
  @Input({required:true}) value!:SecurityPolicySettings;
  @Output() valueChange=new EventEmitter<SecurityPolicySettings>();
  update<K extends keyof SecurityPolicySettings>(field:K,value:SecurityPolicySettings[K]){this.valueChange.emit({...this.value,[field]:value});}
}
