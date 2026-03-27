import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HelpComponent } from './help.component';

describe('HelpComponent', () => {
  let component: HelpComponent;
  let fixture: ComponentFixture<HelpComponent>;
  let router: any;

  beforeEach(async () => {
    router = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [HelpComponent],
      providers: [
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('должен создаваться', () => {
    expect(component).toBeTruthy();
  });

  it('должен возвращаться на главную страницу', () => {
    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('должен отображать заголовок справки', () => {
    const compiled = fixture.nativeElement;
    const heading = compiled.querySelector('h1');
    
    expect(heading).toBeTruthy();
    expect(heading.textContent).toContain('Справка по работе с аннотациями');
  });

  it('должен отображать разделы справки', () => {
    const compiled = fixture.nativeElement;
    const sections = compiled.querySelectorAll('.help-section');
    
    expect(sections.length).toBeGreaterThan(0);
  });

  it('должен отображать палитру цветов', () => {
    const compiled = fixture.nativeElement;
    const colorExamples = compiled.querySelectorAll('.color-example');
    
    expect(colorExamples.length).toBe(6);
  });

  it('должен отображать кнопку назад', () => {
    const compiled = fixture.nativeElement;
    const backButton = compiled.querySelector('.btn-secondary');
    
    expect(backButton).toBeTruthy();
    expect(backButton.textContent).toContain('Назад');
  });

  it('должен отображать инструкции по созданию аннотаций', () => {
    const compiled = fixture.nativeElement;
    const content = compiled.textContent;
    
    expect(content).toContain('Создание аннотации');
    expect(content).toContain('Редактирование аннотации');
    expect(content).toContain('Удаление аннотации');
  });

  it('должен отображать информацию о пересекающихся аннотациях', () => {
    const compiled = fixture.nativeElement;
    const content = compiled.textContent;
    
    expect(content).toContain('Пересекающиеся аннотации');
    expect(content).toContain('градиент');
  });
});
