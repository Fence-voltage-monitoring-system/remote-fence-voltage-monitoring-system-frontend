import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Configuration } from './configuration';

describe('Configuration API integration',()=>{
  let page:Configuration;
  let http:HttpTestingController;
  beforeEach(async()=>{
    await TestBed.configureTestingModule({imports:[Configuration],providers:[provideHttpClient(),provideHttpClientTesting()]}).compileComponents();
    page=TestBed.createComponent(Configuration).componentInstance;
    http=TestBed.inject(HttpTestingController);
    page.ngOnInit();
  });
  afterEach(()=>http.verify());
  const reply=(section:string,value:object)=>({section,value,updatedAt:'2026-09-09T10:00:00Z',updatedBy:'admin@example.com',version:2});
  it('loads real settings and editor metadata',()=>{
    http.expectOne('/api/configuration/general').flush(reply('general',{...page.generalDefaults,systemName:'Saved system'}));
    expect(page.generalValue.systemName).toBe('Saved system');
    expect(page.lastModifiedBy).toBe('admin@example.com');
    expect(page.dirty).toBe(false);expect(page.ready).toBe(true);
  });
  it('retries a failed load and blocks saving defaults',()=>{
    http.expectOne('/api/configuration/general').flush({}, {status:503,statusText:'Unavailable'});
    expect(page.ready).toBe(false);
    page.generalValue.systemName='Changed';page.confirmSave('Test');
    http.expectNone(req=>req.method==='PUT');
    page.retryLoad();
    http.expectOne('/api/configuration/general').flush(reply('general',page.generalDefaults));
    expect(page.ready).toBe(true);expect(page.loadError).toBe('');
  });
  it('cancels a late response when switching sections',()=>{
    const old=http.expectOne('/api/configuration/general');
    page.selectSection('voltage');expect(old.cancelled).toBe(true);
    http.expectOne('/api/configuration/voltage').flush(reply('voltage',{...page.voltageDefaults,healthyKv:6}));
    expect(page.savedVoltage.healthyKv).toBe(6);expect(page.dirty).toBe(false);
    page.selectSection('general');
    http.expectOne('/api/configuration/general').flush(reply('general',page.generalDefaults));
  });
  it('sends values and audit reason then uses the saved response',()=>{
    http.expectOne('/api/configuration/general').flush(reply('general',page.generalDefaults));
    page.generalValue={...page.generalValue,systemName:'New name'};page.showSave=true;
    page.confirmSave(' Update name ');
    const save=http.expectOne('/api/configuration/general');
    expect(save.request.method).toBe('PUT');
    expect(save.request.body.reason).toBe('Update name');
    expect(save.request.body.value.systemName).toBe('New name');
    save.flush(reply('general',page.generalValue));
    expect(page.dirty).toBe(false);expect(page.showSave).toBe(false);
  });
  it('preserves the draft and dialog after a save error',()=>{
    http.expectOne('/api/configuration/general').flush(reply('general',page.generalDefaults));
    page.generalValue={...page.generalValue,systemName:'Unsaved'};page.showSave=true;
    page.confirmSave('Test save');
    http.expectOne('/api/configuration/general').flush({message:'Invalid configuration'},{status:400,statusText:'Bad Request'});
    expect(page.showSave).toBe(true);expect(page.generalValue.systemName).toBe('Unsaved');
    expect(page.dirty).toBe(true);expect(page.saveError).toBe('Invalid configuration');
  });
});

