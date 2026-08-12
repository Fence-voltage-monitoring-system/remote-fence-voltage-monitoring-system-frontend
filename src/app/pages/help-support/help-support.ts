import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Faq } from '../../core/models/support.models';
import { SupportService } from '../../core/services/support.service';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-help-support-page',
  standalone: true,
  imports: [FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './help-support.html',
  styleUrl: './help-support.css',
})
export class HelpSupportPage implements OnInit {
  private readonly supportService = inject(SupportService);

  query = '';
  expandedQuestion = '';
  copied = false;
  isLoading = false;
  usingPreview = false;

  faqs: Faq[] = [];

  ngOnInit(): void {
    this.loadFaqs();
  }

  loadFaqs(): void {
    this.isLoading = true;
    this.supportService.getFaqs().pipe(finalize(() => { this.isLoading = false; })).subscribe({
      next: (faqs) => {
        if (Array.isArray(faqs) && faqs.length > 0) {
          this.faqs = faqs;
          this.usingPreview = false;
        } else {
          this.faqs = [...this.supportService.previewFaqs];
          this.usingPreview = true;
        }
      },
      error: () => {
        this.faqs = [...this.supportService.previewFaqs];
        this.usingPreview = true;
      },
    });
  }

  get filteredFaqs(): Faq[] {
    const term = this.query.trim().toLowerCase();
    return term
      ? this.faqs.filter(item => `${item.question} ${item.answer} ${item.category}`.toLowerCase().includes(term))
      : this.faqs;
  }

  toggle(question: string): void {
    this.expandedQuestion = this.expandedQuestion === question ? '' : question;
  }

  async copyEmail(): Promise<void> {
    await navigator.clipboard.writeText('support@dwc.gov.lk');
    this.copied = true;
    window.setTimeout(() => this.copied = false, 1800);
  }
}
