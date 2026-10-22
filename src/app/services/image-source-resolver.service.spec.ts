import { TestBed } from '@angular/core/testing';

import { ImageSourceResolverService } from './image-source-resolver.service';

describe('ImageSourceResolverService', () => {
  let service: ImageSourceResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ImageSourceResolverService],
    });

    service = TestBed.inject(ImageSourceResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});