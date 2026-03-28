import { TestBed } from '@angular/core/testing';
import { SupplierService } from './supplier.service';

describe('SupplierService', () => {
  let service: SupplierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SupplierService);
  });

  it('debe crearse', () => {
    expect(service).toBeTruthy();
  });

  it('getAll debe devolver al menos los datos semilla', (done) => {
    service.getAll().subscribe((rows) => {
      expect(rows.length).toBeGreaterThanOrEqual(2);
      expect(rows[0]).toEqual(
        jasmine.objectContaining({
          name: jasmine.any(String),
          status: jasmine.any(String),
        }),
      );
      done();
    });
  });

  it('create debe añadir un proveedor', (done) => {
    service
      .create({
        category: 'Test',
        name: 'Proveedor Test',
        suppliedProduct: 'X',
        contact: 'c',
        address: 'a',
        city: 'Bogotá',
      })
      .subscribe(() => {
        service.getAll().subscribe((rows) => {
          expect(rows.some((r) => r.name === 'Proveedor Test')).toBe(true);
          done();
        });
      });
  });
});
