import { TestBed } from '@angular/core/testing';

import { VisionRequestBuilderService } from './vision-request-builder.service';

describe('VisionRequestBuilderService', () => {
  let service: VisionRequestBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VisionRequestBuilderService],
    });

    service = TestBed.inject(VisionRequestBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});