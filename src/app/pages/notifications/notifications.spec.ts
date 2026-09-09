import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER, of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { Notifications } from './notifications';

describe('Notifications',()=>{
  const item={id:1,code:'N1',title:'Critical',message:'Test',category:'CRITICAL' as const,fence:'Real fence',section:'S1',time:'2026-09-09T10:00:00Z',read:false,channels:['IN_APP' as const],relatedAlert:'ALT-TEST'};
  async function setup(overrides:object={}){
    const service={
      getNotifications:vi.fn(()=>of({items:[{...item}],page:1,pageSize:20,totalItems:1,totalPages:1})),
      getStats:()=>of({inApp:1,websocket:0,smsDelivered:0,unread:1}),
      connectLive:()=>NEVER,updateStats:vi.fn(),...overrides
    };
    await TestBed.configureTestingModule({imports:[Notifications],providers:[provideRouter([]),
      {provide:NotificationService,useValue:service},
      {provide:UserService,useValue:{getNotificationPreferences:()=>of({soundEnabled:false,markAsReadOnOpen:false})}}
    ]}).compileComponents();
    const fixture=TestBed.createComponent(Notifications);fixture.detectChanges();
    return {fixture,page:fixture.componentInstance,service};
  }
  it('shows recipient notifications for real fence names',async()=>{
    const {page}=await setup();expect(page.visible.length).toBe(1);expect(page.unread).toBe(1);
  });
  it('opens notification details from a row click and closes them',async()=>{
    // The test DOM does not implement the browser's native dialog methods.
    Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(this:HTMLDialogElement){this.setAttribute('open','');}});
    Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:function(this:HTMLDialogElement){this.removeAttribute('open');}});
    const {fixture}=await setup();
    fixture.nativeElement.querySelector('.item').click();
    fixture.detectChanges();
    const dialog=fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog).not.toBeNull();
    expect(dialog.open).toBe(true);
    expect(dialog.textContent).toContain(item.message);
    expect(dialog.textContent).toContain('View Related Alert');
    dialog.querySelector<HTMLButtonElement>('[aria-label="Close notification details"]')!.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
  });
  it('does not substitute fake notifications on API failure',async()=>{
    const {page}=await setup({getNotifications:()=>throwError(()=>new Error('offline'))});
    expect(page.notifications).toEqual([]);expect(page.error).toContain('Unable to load');
  });
  it('keeps a notification unread if the save fails',async()=>{
    const {page}=await setup({markRead:()=>throwError(()=>new Error('offline'))});
    page.markRead(page.notifications[0]);
    expect(page.notifications[0].read).toBe(false);expect(page.isActionPending).toBe(false);
  });
  it('reloads the unread filter after a saved read action',async()=>{
    const getNotifications=vi.fn()
      .mockReturnValueOnce(of({items:[{...item}],totalPages:1,totalItems:1}))
      .mockReturnValue(of({items:[],totalPages:0,totalItems:0}));
    const {page}=await setup({getNotifications,markRead:()=>of({...item,read:true})});
    page.filter='UNREAD';page.markRead(page.notifications[0]);
    expect(getNotifications).toHaveBeenLastCalledWith({filter:'UNREAD',page:1,pageSize:20});
    expect(page.visible).toEqual([]);
  });
  it('reloads live events instead of inserting duplicates into filtered results',async()=>{
    const live=new Subject<typeof item>();
    const {page,service}=await setup({connectLive:()=>live});
    page.filter='SYSTEM';live.next(item);live.next(item);
    expect(service.getNotifications).toHaveBeenLastCalledWith({filter:'SYSTEM',page:1,pageSize:20});
    expect(page.notifications.length).toBe(1);
  });
  it('opens the related incident',async()=>{
    const {page}=await setup();const navigate=vi.spyOn(TestBed.inject(Router),'navigate').mockResolvedValue(true);
    page.viewAlert(item);expect(navigate).toHaveBeenCalledWith(['/alerts'],{queryParams:{alert:'ALT-TEST'}});
  });
  it('keeps saved read messages in All and excludes them from Unread while refreshing',async()=>{
    const refresh=new Subject<any>();
    const getNotifications=vi.fn()
      .mockReturnValueOnce(of({items:[{...item}],totalPages:1,totalItems:1}))
      .mockReturnValue(refresh);
    const {page,service}=await setup({getNotifications,markAllRead:()=>of({updated:1})});
    page.markAll();
    expect(page.visible).toHaveLength(1);
    expect(page.visible[0].read).toBe(true);
    expect(page.unread).toBe(0);
    expect(service.updateStats).toHaveBeenCalledWith(expect.objectContaining({unread:0}));
    page.filter='UNREAD';
    expect(page.visible).toEqual([]);
  });
  it('does not display the previous tab while its replacement is loading',async()=>{
    const getNotifications=vi.fn()
      .mockReturnValueOnce(of({items:[{...item,read:true}],totalPages:1,totalItems:1}))
      .mockReturnValue(NEVER);
    const {page}=await setup({getNotifications});
    page.changeFilter('UNREAD');
    expect(page.visible).toEqual([]);
    expect(page.isLoading).toBe(true);
  });
  it('preserves unread messages when mark all fails',async()=>{
    const {page}=await setup({markAllRead:()=>throwError(()=>new Error('offline'))});
    page.markAll();
    expect(page.visible[0].read).toBe(false);
    expect(page.unread).toBe(1);
    expect(page.error).toContain('Unable to mark all');
  });
  it('keeps saved read messages across All → Unread → All',async()=>{
    let read=false;
    const getNotifications=vi.fn(query=>of({
      items:query.filter==='UNREAD'&&read?[]:[{...item,read}],totalPages:1,totalItems:query.filter==='UNREAD'&&read?0:1
    }));
    const {page}=await setup({getNotifications,
      markAllRead:()=>{read=true;return of({updated:1});},
      getStats:()=>of({inApp:1,websocket:0,smsDelivered:0,unread:read?0:1})
    });
    page.markAll();
    expect(page.visible[0].read).toBe(true);
    page.changeFilter('UNREAD');
    expect(page.visible).toEqual([]);
    page.changeFilter('ALL');
    expect(page.visible).toHaveLength(1);
    expect(page.visible[0].read).toBe(true);
  });
});
