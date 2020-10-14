import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Image } from './image.entity';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private imagesRepository: Repository<Image>,
  ) {}

  async save(image: Image): Promise<Image> {
    return this.imagesRepository.save(image);
  }

  async fetchMore(page: number): Promise<Image[]> {
    const archived = false;
    const images = await this.imagesRepository.find({
      where: { archived },
      take: 24,
      skip: page * 24,
      order: { id: 'DESC' },
    });
    return Promise.resolve(
      images.map(image => ({
        ...image,
        originalFileURL: image.originalFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        extraLargeFileURL: image.extraLargeFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        largeFileURL: image.largeFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        mediumFileURL: image.mediumFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        smallFileURL: image.smallFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        thumbnailFileURL: image.thumbnailFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
      })),
    );
  }

  async findByIds(ids: number[]): Promise<Image[]> {
    const images = await this.imagesRepository.findByIds(ids);
    return Promise.resolve(
      images.map(image => ({
        ...image,
        originalFileURL: image.originalFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        extraLargeFileURL: image.extraLargeFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        largeFileURL: image.largeFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        mediumFileURL: image.mediumFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        smallFileURL: image.smallFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        thumbnailFileURL: image.thumbnailFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
      })),
    );
  }

  async findById(id: number): Promise<Image> {
    const image = await this.imagesRepository
      .createQueryBuilder('image')
      .leftJoinAndSelect('image.tags', 'tags')
      .where('image.id = :id', { id })
      .getOne();
    return Promise.resolve({
      ...image,
      originalFileURL: image.originalFileURL.replace(
        'https://s3.sa-east-1.amazonaws.com/',
        'https://',
      ),
      extraLargeFileURL: image.extraLargeFileURL.replace(
        'https://s3.sa-east-1.amazonaws.com/',
        'https://',
      ),
      largeFileURL: image.largeFileURL.replace(
        'https://s3.sa-east-1.amazonaws.com/',
        'https://',
      ),
      mediumFileURL: image.mediumFileURL.replace(
        'https://s3.sa-east-1.amazonaws.com/',
        'https://',
      ),
      smallFileURL: image.smallFileURL.replace(
        'https://s3.sa-east-1.amazonaws.com/',
        'https://',
      ),
      thumbnailFileURL: image.thumbnailFileURL.replace(
        'https://s3.sa-east-1.amazonaws.com/',
        'https://',
      ),
    });
  }

  async findAllWithTag(tagLabel: string): Promise<Image[]> {
    const images = await this.imagesRepository
      .createQueryBuilder('image')
      .leftJoin('image.tags', 'tag')
      .where('tag.label = :label', { label: tagLabel })
      .getMany();
    return Promise.resolve(
      images.map(image => ({
        ...image,
        originalFileURL: image.originalFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        extraLargeFileURL: image.extraLargeFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        largeFileURL: image.largeFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        mediumFileURL: image.mediumFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        smallFileURL: image.smallFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        thumbnailFileURL: image.thumbnailFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
      })),
    );
  }

  async fetchMoreByTag(tags: string, page: number): Promise<Image[]> {
    const arrayTags = tags.split(',');
    const images = await this.imagesRepository
      .createQueryBuilder('image')
      .leftJoin('image.tags', 'tag')
      .where('tag.label IN (:...label)', { label: arrayTags })
      .take(24)
      .skip(page * 24)
      .getMany();
    return Promise.resolve(
      images.map(image => ({
        ...image,
        originalFileURL: image.originalFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        extraLargeFileURL: image.extraLargeFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        largeFileURL: image.largeFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        mediumFileURL: image.mediumFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        smallFileURL: image.smallFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
        thumbnailFileURL: image.thumbnailFileURL.replace(
          'https://s3.sa-east-1.amazonaws.com/',
          'https://',
        ),
      })),
    );
  }
}
