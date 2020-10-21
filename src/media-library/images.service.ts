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

  async findByIds(ids: number[]): Promise<Image[]> {
    const images = await this.imagesRepository.findByIds(ids);
    return Promise.resolve(images.map(this.removeS3Domain));
  }

  async findById(id: number): Promise<Image> {
    const image = await this.imagesRepository
      .createQueryBuilder('image')
      .leftJoinAndSelect('image.tags', 'tags')
      .where('image.id = :id', { id })
      .getOne();
    return Promise.resolve(this.removeS3Domain(image));
  }

  async findAllWithTag(tagLabel: string): Promise<Image[]> {
    const images = await this.imagesRepository
      .createQueryBuilder('image')
      .leftJoin('image.tags', 'tag')
      .where('tag.label = :label', { label: tagLabel })
      .getMany();
    return Promise.resolve(images.map(this.removeS3Domain));
  }

  async fetchMore(page: number, tags: string): Promise<Image[]> {
    let query = this.imagesRepository.createQueryBuilder('image');

    if (tags) {
      query = query
        .leftJoin('image.tags', 'tag')
        .where('tag.label IN (:...label)', {
          label: tags.split(','),
        });
    }

    const images = await query
      .orderBy('image.id', 'DESC')
      .take(24)
      .skip(page * 24)
      .getMany();
    return Promise.resolve(images.map(this.removeS3Domain));
  }

  private removeS3Domain(image): Image {
    const s3Domain = 'https://s3.sa-east-1.amazonaws.com/';
    return {
      ...image,
      originalFileURL: image.originalFileURL.replace(s3Domain, 'https://'),
      extraLargeFileURL: image.extraLargeFileURL.replace(s3Domain, 'https://'),
      largeFileURL: image.largeFileURL.replace(s3Domain, 'https://'),
      mediumFileURL: image.mediumFileURL.replace(s3Domain, 'https://'),
      smallFileURL: image.smallFileURL.replace(s3Domain, 'https://'),
      thumbnailFileURL: image.thumbnailFileURL.replace(s3Domain, 'https://'),
    };
  }
}
